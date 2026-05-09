<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignTaskEmployeeRequest;
use App\Http\Requests\Admin\RejectTaskReviewRequest;
use App\Http\Requests\Admin\StoreTaskRequest;
use App\Http\Requests\Admin\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Notification;
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
                ->when($project, fn($query) => $query->where('project_id', $project->id))
                ->whereNull('parent_id')
                ->orderBy('order')
                ->paginate(20);

            return $this->successResponse($this->paginate($tasks, TaskResource::class), 'Tasks retrieved successfully.');
        });
    }
    public function store(StoreTaskRequest $request, ?Project $project = null)
    {
        return $this->handle(function () use ($request, $project) {
            $validated = $request->validated();

            // If creating subtask, inherit from parent
            if (!empty($validated['parent_id'])) {
                $parent = Task::findOrFail($validated['parent_id']);
                $validated['project_id'] = $parent->project_id;
                $validated['assigned_to'] = $parent->assigned_to;
            } else {
                $project = $project ?? $request->route('project');
                $validated['project_id'] = $project?->id ?? $validated['project_id'];
            }

            $task = Task::create($validated);

            // Validate after creation (or do it before with $validated data)
            $this->ensureChildBelongsToParentProject($task);

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

            // Prevent changing project_id or assigned_to if task has children
            if ($task->children()->exists()) {
                unset($validated['project_id'], $validated['assigned_to']);
            }

            // Prevent changing project_id or assigned_to on subtasks
            if ($task->parent_id !== null) {
                unset($validated['project_id'], $validated['assigned_to']);
            }

            $task->update($validated);

            $this->ensureChildBelongsToParentProject($task->fresh());

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

    public function approveTask(Task $task)
    {
        return $this->handle(function () use ($task) {
            $actor = request()->user();

            abort_unless($task->status === 'ready_for_review', 422, 'Task is not ready for review.');

            $task->update(['status' => 'done']);

            ActivityLog::record($actor, 'task_approved', $task, 'Task approved and completed.');
            $this->notifyAssignee($task, 'task_approved', 'Task approved.');

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task approved successfully.'
            );
        });
    }

    public function rejectTask(RejectTaskReviewRequest $request, Task $task)
    {
        return $this->handle(function () use ($request, $task) {
            abort_unless($task->status === 'ready_for_review', 422, 'Task is not ready for review.');

            $task->update(['status' => 'in_progress']);

            $task->comments()->create([
                'user_id' => $request->user()->id,
                'content' => $request->validated('feedback'),
            ]);

            ActivityLog::record($request->user(), 'task_rejected', $task, 'Task review rejected.', [
                'feedback' => $request->validated('feedback'),
            ]);
            $this->notifyAssignee($task, 'task_rejected', $request->validated('feedback'));

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task rejected successfully.'
            );
        });
    }

    protected function notifyAssignee(Task $task, string $type, string $message): void
    {
        if (!$task->assigned_to) {
            return;
        }

        Notification::create([
            'user_id' => $task->assigned_to,
            'type' => $type,
            'data' => [
                'task_id' => $task->id,
                'project_id' => $task->project_id,
                'message' => $message,
            ],
        ]);
    }

    protected function ensureTaskBelongsToProject(Task $task, ?Project $project): void
    {
        if ($project && $task->project_id !== $project->id) {
            abort(404, 'Task not found for the specified project.');
        }
    }
    protected function ensureChildBelongsToParentProject(Task $task): void
    {
        // Only validate if this is a subtask (has parent_id)
        if ($task->parent_id === null) {
            return; // Top-level task, no validation needed
        }

        $parent = Task::find($task->parent_id);

        if (!$parent) {
            abort(422, 'Parent task not found.');
        }

        if ($task->project_id !== $parent->project_id) {
            abort(403, 'Subtask must belong to the same project as its parent task.');
        }

        if ($task->assigned_to !== $parent->assigned_to) {
            abort(403, 'Subtask must be assigned to the same employee as its parent task.');
        }
    }
}
