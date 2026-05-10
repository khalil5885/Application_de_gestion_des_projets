<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Request as UserRequest;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class WorkspaceController extends Controller
{
    public function calendar(Request $request)
    {
        return $this->handle(function () use ($request) {
            $user = $request->user();
            $start = $request->filled('start')
                ? Carbon::parse($request->input('start'))->startOfDay()
                : now()->startOfMonth()->startOfDay();
            $end = $request->filled('end')
                ? Carbon::parse($request->input('end'))->endOfDay()
                : now()->endOfMonth()->endOfDay();

            $tasks = Task::query()
                ->where('assigned_to', $user->id)
                ->with(['project:id,name,end_date,progress,status', 'parent:id,title,progress,status'])
                ->whereNotNull('due_date')
                ->whereBetween('due_date', [$start->toDateString(), $end->toDateString()])
                ->orderBy('due_date')
                ->limit(160)
                ->get();

            $projectDeadlines = Project::query()
                ->whereHas('members', fn(Builder $query) => $query->whereKey($user->id))
                ->whereNotNull('end_date')
                ->whereBetween('end_date', [$start->toDateString(), $end->toDateString()])
                ->orderBy('end_date')
                ->limit(80)
                ->get(['id', 'name', 'status', 'end_date', 'progress']);

            $extensionRequests = UserRequest::query()
                ->where('user_id', $user->id)
                ->where('type', 'extension')
                ->whereIn('status', ['pending', 'approved'])
                ->with('requestable')
                ->latest()
                ->limit(80)
                ->get();

            $extensionRequests->loadMorph('requestable', [
                Task::class => ['project:id,name,end_date,progress,status'],
                Project::class => [],
            ]);

            $events = $tasks
                ->map(fn(Task $task) => $this->taskEvent($task))
                ->merge($projectDeadlines->map(fn(Project $project) => $this->projectEvent($project)))
                ->merge($extensionRequests->map(fn(UserRequest $request) => $this->extensionEvent($request))->filter())
                ->sortBy('date')
                ->values();

            return $this->successResponse([
                'events' => $events,
                'today_focus' => $this->todayFocus($user->id),
                'upcoming_deadlines' => $this->upcomingDeadlines($user->id),
                'workload' => $this->workload($user->id),
                'dependency_tree' => $this->dependencyTree($user->id),
            ], 'Employee workspace calendar retrieved successfully.');
        });
    }

    public function activity(Request $request)
    {
        return $this->handle(function () use ($request) {
            $logs = ActivityLog::query()
                ->with('user:id,name,email,avatar')
                ->where('user_id', $request->user()->id)
                ->latest()
                ->paginate((int) $request->integer('per_page', 15));

            return $this->successResponse($this->paginateActivity($logs), 'Employee activity retrieved successfully.');
        });
    }

    public function productivity(Request $request)
    {
        return $this->handle(function () use ($request) {
            $userId = $request->user()->id;

            return $this->successResponse([
                'charts' => [
                    'weekly_completion_trend' => $this->weeklyCompletionTrend($userId),
                    'task_status_distribution' => $this->statusDistribution($userId),
                    'monthly_productivity' => $this->monthlyProductivity($userId),
                ],
            ], 'Employee productivity analytics retrieved successfully.');
        });
    }

    private function taskEvent(Task $task): array
    {
        $isOverdue = $task->due_date && $task->due_date->isPast() && $task->status !== 'done';

        return [
            'id' => 'task-' . $task->id,
            'type' => 'task',
            'source_id' => $task->id,
            'project_id' => $task->project_id,
            'date' => $task->due_date?->toDateString(),
            'title' => $task->title,
            'project_name' => $task->project?->name,
            'status' => $isOverdue ? 'overdue' : $task->status,
            'priority' => $task->priority,
            'progress' => (int) ($task->progress ?? 0),
            'parent_task' => $task->parent?->title,
            'health' => $this->taskHealth($task),
            'badges' => array_values(array_filter([
                $isOverdue ? 'overdue' : null,
                $task->status === 'done' ? 'completed' : null,
                $task->status === 'ready_for_review' ? 'ready_for_review' : null,
                $task->priority === 'high' ? 'high_priority' : null,
            ])),
        ];
    }

    private function projectEvent(Project $project): array
    {
        return [
            'id' => 'project-' . $project->id,
            'type' => 'project_deadline',
            'source_id' => $project->id,
            'project_id' => $project->id,
            'date' => $project->end_date?->toDateString(),
            'title' => $project->name,
            'project_name' => $project->name,
            'status' => $project->end_date?->isPast() && $project->status !== 'done' ? 'overdue' : 'project_deadline',
            'priority' => null,
            'progress' => (int) ($project->progress ?? 0),
            'health' => $project->end_date?->isPast() ? 'at_risk' : 'healthy',
            'badges' => ['project_deadline'],
        ];
    }

    private function extensionEvent(UserRequest $request): ?array
    {
        $requestedDeadline = $request->payload['requested_deadline'] ?? null;

        if (!$requestedDeadline) {
            return null;
        }

        $requestable = $request->requestable;
        $project = $requestable instanceof Task ? $requestable->project : $requestable;

        return [
            'id' => 'extension-' . $request->id,
            'type' => 'extension_request',
            'source_id' => $request->id,
            'project_id' => $project?->id,
            'date' => Carbon::parse($requestedDeadline)->toDateString(),
            'title' => 'Extension request: ' . ($requestable?->title ?? $requestable?->name ?? 'Deadline'),
            'project_name' => $project?->name,
            'status' => $request->status === 'pending' ? 'extension_pending' : 'extension_' . $request->status,
            'priority' => null,
            'progress' => $requestable?->progress ?? 0,
            'health' => $request->status === 'pending' ? 'at_risk' : 'healthy',
            'badges' => ['extension_pending'],
        ];
    }

    private function todayFocus(int $userId)
    {
        return Task::query()
            ->where('assigned_to', $userId)
            ->with(['project:id,name', 'parent:id,title,progress,status'])
            ->where('status', '!=', 'done')
            ->where(function (Builder $query) {
                $query
                    ->whereDate('due_date', '<=', now())
                    ->orWhere('priority', 'high')
                    ->orWhere('status', 'ready_for_review')
                    ->orWhere('status', 'on_hold');
            })
            ->orderByRaw("CASE WHEN due_date < CURDATE() THEN 0 WHEN due_date = CURDATE() THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->orderBy('due_date')
            ->limit(8)
            ->get()
            ->map(fn(Task $task) => $this->taskSummary($task));
    }

    private function upcomingDeadlines(int $userId)
    {
        return Task::query()
            ->where('assigned_to', $userId)
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->with(['project:id,name'])
            ->orderBy('due_date')
            ->limit(8)
            ->get()
            ->map(fn(Task $task) => $this->taskSummary($task));
    }

    private function workload(int $userId): array
    {
        $active = Task::where('assigned_to', $userId)->where('status', '!=', 'done')->count();
        $overdue = Task::where('assigned_to', $userId)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now())
            ->where('status', '!=', 'done')
            ->count();
        $completedWeek = Task::where('assigned_to', $userId)
            ->where('status', 'done')
            ->where('updated_at', '>=', now()->startOfWeek())
            ->count();
        $total = Task::where('assigned_to', $userId)->count();
        $completed = Task::where('assigned_to', $userId)->where('status', 'done')->count();
        $ready = Task::where('assigned_to', $userId)->where('status', 'ready_for_review')->count();

        return [
            'active_tasks' => $active,
            'overdue_tasks' => $overdue,
            'completed_this_week' => $completedWeek,
            'completion_rate' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            'ready_for_review' => $ready,
            'status' => $this->workloadLevel($active),
        ];
    }

    private function dependencyTree(int $userId)
    {
        return Task::query()
            ->where('assigned_to', $userId)
            ->whereNull('parent_id')
            ->with(['project:id,name', 'childrenRecursive.assignee'])
            ->orderBy('due_date')
            ->limit(8)
            ->get()
            ->map(fn(Task $task) => $this->dependencyNode($task));
    }

    private function dependencyNode(Task $task): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'status' => $task->status,
            'progress' => (int) ($task->progress ?? 0),
            'health' => $this->taskHealth($task),
            'children' => $task->childrenRecursive->map(fn(Task $child) => $this->dependencyNode($child))->values(),
        ];
    }

    private function taskSummary(Task $task): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'project_id' => $task->project_id,
            'project_name' => $task->project?->name,
            'status' => $task->status,
            'priority' => $task->priority,
            'due_date' => $task->due_date?->toDateString(),
            'progress' => (int) ($task->progress ?? 0),
            'parent_task' => $task->parent?->title,
            'health' => $this->taskHealth($task),
        ];
    }

    private function taskHealth(Task $task): string
    {
        if ($task->status === 'on_hold') {
            return 'blocked';
        }

        if ($task->due_date && $task->due_date->isPast() && $task->status !== 'done') {
            return 'critical';
        }

        if ($task->due_date && $task->due_date->diffInDays(now(), false) >= -2 && (int) $task->progress < 50 && $task->status !== 'done') {
            return 'at_risk';
        }

        return 'healthy';
    }

    private function workloadLevel(int $activeTasks): string
    {
        return match (true) {
            $activeTasks >= 10 => 'overloaded',
            $activeTasks >= 7 => 'high',
            $activeTasks >= 4 => 'medium',
            default => 'low',
        };
    }

    private function weeklyCompletionTrend(int $userId): array
    {
        $rows = Task::query()
            ->where('assigned_to', $userId)
            ->where('status', 'done')
            ->where('updated_at', '>=', now()->subWeeks(7)->startOfWeek())
            ->selectRaw('YEARWEEK(updated_at, 1) as week_key, MIN(DATE(updated_at)) as week_start, COUNT(*) as total')
            ->groupBy('week_key')
            ->orderBy('week_key')
            ->get();

        return [
            'labels' => $rows->pluck('week_start')->values(),
            'data' => $rows->pluck('total')->map(fn($value) => (int) $value)->values(),
        ];
    }

    private function monthlyProductivity(int $userId): array
    {
        $rows = Task::query()
            ->where('assigned_to', $userId)
            ->where('status', 'done')
            ->where('updated_at', '>=', now()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(updated_at, '%Y-%m') as month_key, COUNT(*) as total")
            ->groupBy('month_key')
            ->orderBy('month_key')
            ->get();

        return [
            'labels' => $rows->pluck('month_key')->values(),
            'data' => $rows->pluck('total')->map(fn($value) => (int) $value)->values(),
        ];
    }

    private function statusDistribution(int $userId): array
    {
        $counts = Task::query()
            ->where('assigned_to', $userId)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'todo' => (int) ($counts['todo'] ?? 0),
            'in_progress' => (int) ($counts['in_progress'] ?? 0),
            'ready_for_review' => (int) ($counts['ready_for_review'] ?? 0),
            'done' => (int) ($counts['done'] ?? 0),
            'on_hold' => (int) ($counts['on_hold'] ?? 0),
        ];
    }

    private function paginateActivity($logs): array
    {
        return [
            'items' => collect($logs->items())->map(fn(ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'properties' => $log->properties,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                    'avatar' => $log->user->avatar,
                ] : null,
                'created_at' => $log->created_at?->toISOString(),
            ])->values(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ];
    }
}
