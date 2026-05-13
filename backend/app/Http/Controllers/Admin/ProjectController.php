<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignProjectEmployeeRequest;
use App\Http\Requests\Admin\RemoveProjectMemberRequest;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskTemplate;
use App\Models\User;
use App\Services\AiEstimationService;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class ProjectController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $projects = Project::query()
                ->with(['client', 'projectType'])
                ->latest()
                ->paginate(15);

            return $this->successResponse($this->paginate($projects, ProjectResource::class), 'Projects retrieved successfully.');
        });
    }

    public function store(StoreProjectRequest $request)
    {
        return $this->handle(function () use ($request) {
            $project = Project::create($request->validated());

            if ($project->project_type_id) {
                $templates = TaskTemplate::query()
                    ->where('project_type_id', $project->project_type_id)
                    ->orderBy('order')
                    ->get();

                foreach ($templates as $template) {
                    Task::create([
                        'project_id' => $project->id,
                        'title' => $template->name,
                        'description' => $template->description,
                        'due_date' => $project->start_date?->copy()->addDays($template->default_due_days),
                        'order' => $template->order,
                    ]);
                }

                $project->refreshProgress();
            }

            ActivityLog::record($request->user(), 'project_created', $project, 'Project created.');

            return $this->successResponse(
                ProjectResource::make($project->load(['client', 'projectType', 'members', 'rootTasks.children', 'comments.user'])),
                'Project created successfully.',
                201
            );
        });
    }

    public function show(Project $project)
    {
        return $this->handle(function () use ($project) {
            $project->load(['client', 'projectType', 'members', 'rootTasks.children.assignee', 'comments.user']);

            return $this->successResponse(ProjectResource::make($project), 'Project retrieved successfully.');
        });
    }

    public function update(UpdateProjectRequest $request, Project $project)
    {
        return $this->handle(function () use ($request, $project) {
            $project->update($request->validated());

            ActivityLog::record($request->user(), 'project_updated', $project, 'Project updated.', $request->validated());

            return $this->successResponse(
                ProjectResource::make($project->fresh()->load(['client', 'projectType', 'members', 'rootTasks.children', 'comments.user'])),
                'Project updated successfully.'
            );
        });
    }

    public function destroy(Project $project)
    {
        return $this->handle(function () use ($project) {
            $actor = request()->user();
            $project->delete();

            ActivityLog::record($actor, 'project_deleted', $project, 'Project deleted.');

            return $this->successResponse(null, 'Project deleted successfully.');
        });
    }

    public function assignEmployee(AssignProjectEmployeeRequest $request, Project $project)
    {
        return $this->handle(function () use ($request, $project) {
            $validated = $request->validated();
            $user = User::findOrFail($validated['member_id']);

            $project->members()->syncWithoutDetaching([
                $user->id => ['role' => $validated['role'] ?? 'member'],
            ]);

            ActivityLog::record($request->user(), 'project_member_assigned', $project, 'Employee assigned to project.', $validated);

            return $this->successResponse(
                ProjectResource::make($project->fresh()->load(['client', 'projectType', 'members', 'rootTasks.children', 'comments.user'])),
                'Employee assigned successfully.'
            );
        });
    }

    public function removeMember(RemoveProjectMemberRequest $request, Project $project)
    {
        return $this->handle(function () use ($request, $project) {
            $userId = $request->validated('member_id');
            $project->members()->detach($userId);

            ActivityLog::record($request->user(), 'project_member_removed', $project, 'Employee removed from project.', ['user_id' => $userId]);

            return $this->successResponse(
                ProjectResource::make($project->fresh()->load(['client', 'projectType', 'members', 'rootTasks.children', 'comments.user'])),
                'Project member removed successfully.'
            );
        });
    }

    public function estimate(Project $project, AiEstimationService $estimator)
    {
        return $this->handle(function () use ($project, $estimator) {
            $estimate = $estimator->estimate($project);
            $project->update($estimate);

            ActivityLog::record(request()->user(), 'project_ai_estimated', $project, 'AI project estimate generated.', $estimate);

            return $this->successResponse(
                ProjectResource::make($project->fresh()->load(['client', 'projectType', 'members', 'rootTasks.children', 'comments.user'])),
                'Project estimate generated successfully.'
            );
        });
    }
    public function finalizeReview(Request $request, Project $project)
{
    return $this->handle(function () use ($request, $project) {
        abort_unless($project->status === 'in_review', 422, 'Project is not under review.');

        $approved = $request->boolean('approved');

        $project->update([
            'status' => $approved ? 'completed' : 'needs_revision',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $memberIds = $project->members()->pluck('users.id');

        NotificationService::send($memberIds, 'project_final_review', [
            'project_id' => $project->id,
            'approved' => $approved,
            'feedback' => $request->input('feedback'),
        ]);

        ActivityLog::record(
            $request->user(),
            $approved ? 'project_review_passed' : 'project_review_failed',
            $project,
            $approved ? 'Project approved.' : 'Project needs revision.'
        );

        return $this->successResponse(ProjectResource::make($project), 'Project review finalized.');
    });
}
}
