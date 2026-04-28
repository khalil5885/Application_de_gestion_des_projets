<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignTaskEmployeeRequest;
use App\Http\Requests\Admin\StoreTaskRequest;
use App\Http\Requests\Admin\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request, ?Project $project = null)
    {
        return $this->handle(function () use ($request, $project) {
            $project = $project ?? $request->route('project');

            $tasks = Task::query()
                ->with(['assignee', 'children.assignee', 'comments.user'])
                ->when($project, fn ($query) => $query->where('project_id', $project->id))
                ->whereNull('parent_id')
                ->orderBy('order')
                ->paginate(20);

            return $this->successResponse($this->paginate($tasks, TaskResource::class), 'Tasks retrieved successfully.');
        });
    }

    public function store(StoreTaskRequest $request, ?Project $project = null)
    {
        return $this->handle(function () use ($request, $project) {
            $project = $project ?? $request->route('project');
            $validated = $request->validated();
            $validated['project_id'] = $project?->id ?? $validated['project_id'];

            $task = Task::create($validated);

            ActivityLog::record($request->user(), 'task_created', $task, 'Task created.');

            return $this->successResponse(
                TaskResource::make($task->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task created successfully.',
                201
            );
        });
    }

    public function show(Request $request, Task $task, ?Project $project = null)
    {
        return $this->handle(function () use ($request, $task, $project) {
            $this->ensureTaskBelongsToProject($task, $project ?? $request->route('project'));
            $task->load(['assignee', 'children.assignee', 'comments.user']);

            return $this->successResponse(TaskResource::make($task), 'Task retrieved successfully.');
        });
    }

    public function update(UpdateTaskRequest $request, Task $task, ?Project $project = null)
    {
        return $this->handle(function () use ($request, $task, $project) {
            $this->ensureTaskBelongsToProject($task, $project ?? $request->route('project'));
            $validated = $request->validated();

            if (($project ?? $request->route('project')) !== null) {
                $validated['project_id'] = ($project ?? $request->route('project'))->id;
            }

            $task->update($validated);

            ActivityLog::record($request->user(), 'task_updated', $task, 'Task updated.', $validated);

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task updated successfully.'
            );
        });
    }

    public function destroy(Request $request, Task $task, ?Project $project = null)
    {
        return $this->handle(function () use ($request, $task, $project) {
            $this->ensureTaskBelongsToProject($task, $project ?? $request->route('project'));
            $task->delete();

            ActivityLog::record($request->user(), 'task_deleted', $task, 'Task deleted.');

            return $this->successResponse(null, 'Task deleted successfully.');
        });
    }

    public function assignEmployee(AssignTaskEmployeeRequest $request, Task $task)
    {
        return $this->handle(function () use ($request, $task) {
            $task->update(['assigned_to' => $request->validated('assigned_to')]);

            ActivityLog::record($request->user(), 'task_assigned', $task, 'Task assigned to employee.', $request->validated());

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task assigned successfully.'
            );
        });
    }

    public function unassignEmployee(Task $task)
    {
        return $this->handle(function () use ($task) {
            $actor = request()->user();
            $task->update(['assigned_to' => null]);

            ActivityLog::record($actor, 'task_unassigned', $task, 'Task unassigned from employee.');

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task unassigned successfully.'
            );
        });
    }

    protected function ensureTaskBelongsToProject(Task $task, ?Project $project): void
    {
        if ($project && $task->project_id !== $project->id) {
            abort(404, 'Task not found for the specified project.');
        }
    }
}
