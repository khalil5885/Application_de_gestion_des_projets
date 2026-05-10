<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTaskTemplateRequest;
use App\Http\Requests\Admin\UpdateTaskTemplateRequest;
use App\Http\Resources\TaskTemplateResource;
use App\Models\ActivityLog;
use App\Models\ProjectType;
use App\Models\TaskTemplate;
use Illuminate\Http\Request;

class TaskTemplateController extends Controller
{
    public function index(Request $request, ProjectType $projectType)
    {
        return $this->handle(function () use ($projectType) {
            $templates = TaskTemplate::query()
                ->with('projectType')
                ->where('project_type_id', $projectType->id)
                ->orderBy('order')
                ->paginate(20);

            return $this->successResponse(
                $this->paginate($templates, TaskTemplateResource::class),
                'Task templates retrieved successfully.'
            );
        });
    }

    // NEW: Get ALL templates (including inactive) for dedicated page
    public function allTemplates(Request $request)
    {
        return $this->handle(function () use ($request) {
            $templates = TaskTemplate::query()
                ->with('projectType')
                ->when($request->has('project_type_id'), fn ($q) => $q->where('project_type_id', $request->project_type_id))
                ->when($request->boolean('only_inactive'), fn ($q) => $q->inactive())
                ->orderBy('project_type_id')
                ->orderBy('order')
                ->paginate(20);

            return $this->successResponse(
                $this->paginate($templates, TaskTemplateResource::class),
                'All task templates retrieved successfully.'
            );
        });
    }

    public function store(StoreTaskTemplateRequest $request, ProjectType $projectType)
    {
        return $this->handle(function () use ($request, $projectType) {
            $validated = $request->validated();
            $validated['project_type_id'] = $projectType->id;

            $template = TaskTemplate::create($validated);
            ActivityLog::record($request->user(), 'task_template_created', $template, 'Task template created.');

            return $this->successResponse(
                TaskTemplateResource::make($template->load('projectType')),
                'Task template created successfully.',
                201
            );
        });
    }

    public function show(ProjectType $projectType, TaskTemplate $taskTemplate)
    {
        return $this->handle(fn () =>
            $this->successResponse(
                TaskTemplateResource::make($taskTemplate->load('projectType')),
                'Task template retrieved successfully.'
            )
        );
    }

    public function update(UpdateTaskTemplateRequest $request, ProjectType $projectType, TaskTemplate $taskTemplate)
    {
        return $this->handle(function () use ($request, $projectType, $taskTemplate) {
            $validated = $request->validated();
            $validated['project_type_id'] = $projectType->id;

            $taskTemplate->update($validated);
            ActivityLog::record($request->user(), 'task_template_updated', $taskTemplate, 'Task template updated.', $validated);

            return $this->successResponse(
                TaskTemplateResource::make($taskTemplate->fresh()->load('projectType')),
                'Task template updated successfully.'
            );
        });
    }

    // NEW: Soft unassign (set is_active = false) instead of delete
    public function unassign(ProjectType $projectType, TaskTemplate $taskTemplate)
    {
        return $this->handle(function () use ($taskTemplate) {
            $taskTemplate->update(['is_active' => false]);
            ActivityLog::record(request()->user(), 'task_template_unassigned', $taskTemplate, 'Task template unassigned from project type.');

            return $this->successResponse(
                TaskTemplateResource::make($taskTemplate->fresh()->load('projectType')),
                'Task template unassigned successfully.'
            );
        });
    }

    // NEW: Reassign (set is_active = true)
    public function reassign(ProjectType $projectType, TaskTemplate $taskTemplate)
    {
        return $this->handle(function () use ($taskTemplate) {
            $taskTemplate->update(['is_active' => true]);
            ActivityLog::record(request()->user(), 'task_template_reassigned', $taskTemplate, 'Task template reassigned to project type.');

            return $this->successResponse(
                TaskTemplateResource::make($taskTemplate->fresh()->load('projectType')),
                'Task template reassigned successfully.'
            );
        });
    }

    // HARD DELETE - only for dedicated task templates page
    public function destroy(ProjectType $projectType, TaskTemplate $taskTemplate)
    {
        return $this->handle(function () use ($taskTemplate) {
            $taskTemplate->delete();
            ActivityLog::record(request()->user(), 'task_template_deleted', $taskTemplate, 'Task template permanently deleted.');

            return $this->successResponse(null, 'Task template deleted successfully.');
        });
    }
}