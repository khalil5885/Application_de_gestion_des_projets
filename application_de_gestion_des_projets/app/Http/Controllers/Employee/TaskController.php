<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Task;

class TaskController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $user = request()->user();
            $tasks = Task::query()
                ->where('assigned_to', $user->id)
                ->with(['project', 'assignee', 'children.assignee', 'comments.user'])
                ->orderBy('due_date')
                ->paginate(20);

            return $this->successResponse($this->paginate($tasks, TaskResource::class), 'Employee tasks retrieved successfully.');
        });
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task)
    {
        return $this->handle(function () use ($request, $task) {
            abort_unless($task->assigned_to === $request->user()->id, 403, 'You are not assigned to this task.');

            $task->update($request->validated());

            ActivityLog::record($request->user(), 'task_status_updated', $task, 'Employee updated task status.', $request->validated());

            return $this->successResponse(TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])), 'Task status updated successfully.');
        });
    }

    public function markReadyForReview(Task $task)
    {
        return $this->handle(function () use ($task) {
            $user = request()->user();

            abort_unless($task->assigned_to === $user->id, 403, 'You are not assigned to this task.');

            $task->update(['status' => 'ready_for_review']);

            ActivityLog::record($user, 'task_ready_for_review', $task, 'Employee marked task ready for review.');

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children.assignee', 'comments.user'])),
                'Task marked ready for review successfully.'
            );
        });
    }
}
