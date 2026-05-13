<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Request as UserRequest;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class TaskController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $user = request()->user();
            $tasks = Task::query()
                ->where('assigned_to', $user->id)
                ->with(['assignee', 'children', 'comments.user'])
                ->whereNull('parent_id')
                ->orderBy('due_date')
                ->paginate(20);

            return $this->successResponse(
                $this->paginate($tasks, TaskResource::class),
                'Employee tasks retrieved successfully.'
            );
        });
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task)
    {
        return $this->handle(function () use ($request, $task) {
            abort_unless($task->assigned_to === $request->user()->id, 403, 'You are not assigned to this task.');

            $task->update($request->validated());

            ActivityLog::record(
                $request->user(),
                'task_status_updated',
                $task,
                'Employee updated task status.',
                $request->validated()
            );

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children', 'comments.user'])),
                'Task status updated successfully.'
            );
        });
    }

    public function markReadyForReview(Task $task)
    {
        return $this->handle(function () use ($task) {
            $user = request()->user();

            abort_unless($task->assigned_to === $user->id, 403, 'You are not assigned to this task.');

            $task = DB::transaction(function () use ($task, $user) {
                $task->update(['status' => 'ready_for_review']);

                ActivityLog::record($user, 'task_ready_for_review', $task, 'Employee marked task ready for review.');

                // Create task review request
                $this->createTaskReviewRequest($task, $user);

                // Check if project should auto-advance
                $this->maybeAdvanceProject($task->project);

                return $task;
            });

            return $this->successResponse(
                TaskResource::make($task->fresh()->load(['assignee', 'children', 'comments.user'])),
                'Task marked ready for review successfully.'
            );
        });
    }

    protected function createTaskReviewRequest(Task $task, $employee): void
    {
        // Prevent duplicate pending requests
        $exists = UserRequest::where('requestable_id', $task->id)
            ->where('requestable_type', Task::class)
            ->where('type', 'task_review')
            ->where('status', 'pending')
            ->exists();

        if ($exists) {
            return;
        }

        UserRequest::create([
            'user_id' => $employee->id,
            'requestable_id' => $task->id,
            'requestable_type' => Task::class,
            'type' => 'task_review',
            'payload' => [
                'previous_status' => $task->getOriginal('status'),
                'notes' => request('notes'),
            ],
            'status' => 'pending',
        ]);

        $adminIds = User::where('global_role', 'admin')->pluck('id');

        NotificationService::send($adminIds, 'task_review_request_created', [
            'task_id' => $task->id,
            'task_title' => $task->title,
            'employee_name' => $employee->name,
        ]);
    }

    protected function maybeAdvanceProject(?Project $project): void
    {
        if (!$project) {
            return;
        }

        if (in_array($project->status, ['ready_for_review', 'in_review', 'completed', 'needs_revision'])) {
            return;
        }

        $allTasks = $project->rootTasks;

        if ($allTasks->isEmpty()) {
            return;
        }

        $allComplete = $allTasks->every(
            fn(Task $t) => in_array($t->status, ['done', 'ready_for_review'])
        );

        if (!$allComplete) {
            return;
        }

        $hasReviewPending = $allTasks->contains(
            fn(Task $t) => $t->status === 'ready_for_review'
        );

        if (!$hasReviewPending) {
            return;
        }

        $project->update(['status' => 'ready_for_review']);

        $exists = UserRequest::where('requestable_id', $project->id)
            ->where('requestable_type', Project::class)
            ->where('type', 'project_review')
            ->where('status', 'pending')
            ->exists();

        if ($exists) {
            return;
        }

        $member = $project->members()->first();

        UserRequest::create([
            'user_id' => $member?->id,
            'requestable_id' => $project->id,
            'requestable_type' => Project::class,
            'type' => 'project_review',
            'payload' => [
                'trigger' => 'auto',
                'reason' => 'All root tasks are done or ready for review.',
                'task_statuses' => $allTasks->pluck('status', 'id'),
            ],
            'status' => 'pending',
        ]);

        $adminIds = User::where('global_role', 'admin')->pluck('id');

        NotificationService::send($adminIds, 'project_auto_ready_for_review', [
            'project_id' => $project->id,
            'project_title' => $project->title,
        ]);
    }

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

            if (!isset($decoded['order'])) {
                \Log::error('Invalid AI response', ['content' => $content]);

                return $this->successResponse(
                    $tasks->map(fn($t) => ['id' => $t->id, 'reason' => 'AI parsing failed'])->values(),
                    'Task order retrieved (fallback).'
                );
            }

            return $this->successResponse($decoded['order'], 'Task order suggested successfully.');
        });
    }
}