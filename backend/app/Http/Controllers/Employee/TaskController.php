<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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
    // In EmployeeTaskController
public function suggestOrder(Request $request)
{
    return $this->handle(function () use ($request) {
        $tasks = $request->user()
            ->assignedTasks()
            ->whereNotIn('status', ['done', 'cancelled'])
            ->get(['id', 'title', 'priority', 'due_date', 'status']);

        if ($tasks->isEmpty()) {
            return $this->successResponse([], 'No active tasks found.');
        }

        $response = Http::timeout(30)
            ->withToken(config('services.groq.key'))
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a productivity expert. Given a list of tasks, return ONLY a valid JSON object with a single key "order" containing an array. Each item must have "id" (int) and "reason" (string). No markdown, no extra text.',
                    ],
                    [
                        'role' => 'user',
                        'content' => 'Order these tasks by priority: ' . $tasks->toJson(),
                    ],
                ],
                'temperature' => 0.3,
                'response_format' => ['type' => 'json_object'],
            ]);

        if ($response->failed()) {
            return $this->successResponse(
                $tasks->map(fn($t) => ['id' => $t->id, 'reason' => 'AI unavailable'])->values(),
                'Task order retrieved (fallback).'
            );
        }
        
        $content = $response->json('choices.0.message.content');
        $decoded = json_decode($content, true);
        $ordered = $decoded['order'] ?? [];
        if (!isset($decoded['order'])) {
    \Log::error('Invalid AI response', ['content' => $content]);

    return $this->successResponse(
        $tasks->map(fn($t) => ['id' => $t->id, 'reason' => 'AI parsing failed'])->values(),
        'Task order retrieved (fallback).'
    );
}

        return $this->successResponse($ordered, 'Task order suggested successfully.');
    });
}
    
}
