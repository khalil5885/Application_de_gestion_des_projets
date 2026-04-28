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
    public function index(Request $request)
    {
        return $this->handle(function () use ($request) {
            $projectType = $request->route('project_type');

            $templates = TaskTemplate::query()
                ->with('projectType')
                ->when($projectType, fn ($query) => $query->where('project_type_id', $projectType->id))
                ->orderBy('order')
                ->paginate(20);

            return $this->successResponse($this->paginate($templates, TaskTemplateResource::class), 'Task templates retrieved successfully.');
        });
    }

    public function store(StoreTaskTemplateRequest $request)
    {
        return $this->handle(function () use ($request) {
            $projectType = $request->route('project_type');
            $validated = $request->validated();
            $validated['project_type_id'] = $projectType?->id ?? $validated['project_type_id'];

            $template = TaskTemplate::create($validated);
            ActivityLog::record($request->user(), 'task_template_created', $template, 'Task template created.');

            return $this->successResponse(TaskTemplateResource::make($template->load('projectType')), 'Task template created successfully.', 201);
        });
    }

    public function show(TaskTemplate $taskTemplate)
    {
        return $this->handle(fn () => $this->successResponse(TaskTemplateResource::make($taskTemplate->load('projectType')), 'Task template retrieved successfully.'));
    }

    public function update(UpdateTaskTemplateRequest $request, TaskTemplate $taskTemplate)
    {
        return $this->handle(function () use ($request, $taskTemplate) {
            $projectType = $request->route('project_type');
            $validated = $request->validated();

            if ($projectType instanceof ProjectType) {
                $validated['project_type_id'] = $projectType->id;
            }

            $taskTemplate->update($validated);

            ActivityLog::record($request->user(), 'task_template_updated', $taskTemplate, 'Task template updated.', $validated);

            return $this->successResponse(TaskTemplateResource::make($taskTemplate->fresh()->load('projectType')), 'Task template updated successfully.');
        });
    }

    public function destroy(TaskTemplate $taskTemplate)
    {
        return $this->handle(function () use ($taskTemplate) {
            $actor = request()->user();
            $taskTemplate->delete();

            ActivityLog::record($actor, 'task_template_deleted', $taskTemplate, 'Task template deleted.');

            return $this->successResponse(null, 'Task template deleted successfully.');
        });
    }
}
