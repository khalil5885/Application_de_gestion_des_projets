<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeWorkloadResource;
use App\Http\Resources\WorkloadOverviewResource;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkloadController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $employees = User::query()
                ->where('global_role', 'employee')
                ->withCount([
                    'assignedTasks as active_tasks_count' => fn(Builder $query) => $query->where('status', '!=', 'done'),
                    'assignedTasks as overdue_tasks_count' => fn(Builder $query) => $query
                        ->whereNotNull('due_date')
                        ->whereDate('due_date', '<', now())
                        ->where('status', '!=', 'done'),
                    'assignedTasks as ready_for_review_tasks_count' => fn(Builder $query) => $query
                        ->where('status', 'ready_for_review'),
                    'assignedTasks as completed_this_month_count' => fn(Builder $query) => $query
                        ->where('status', 'done')
                        ->whereBetween('updated_at', [now()->startOfMonth(), now()->endOfMonth()]),
                    'assignedTasks as total_assigned_tasks_count',
                    'assignedTasks as completed_tasks_count' => fn(Builder $query) => $query->where('status', 'done'),
                ])
                ->orderBy('name')
                ->get()
                ->map(function (User $employee) {
                    $employee->workload_level = $this->calculateWorkloadLevel((int) $employee->active_tasks_count);

                    return $employee;
                });

            $employeeResources = WorkloadOverviewResource::collection($employees)->resolve();

            return $this->successResponse([
                'employees' => $employeeResources,
                'charts' => [
                    'most_assigned_employees' => [
                        'labels' => $employees->sortByDesc('active_tasks_count')->take(10)->pluck('name')->values(),
                        'data' => $employees->sortByDesc('active_tasks_count')->take(10)->pluck('active_tasks_count')->values(),
                    ],
                    'most_productive_employees' => [
                        'labels' => $employees->sortByDesc('completed_this_month_count')->take(10)->pluck('name')->values(),
                        'data' => $employees->sortByDesc('completed_this_month_count')->take(10)->pluck('completed_this_month_count')->values(),
                    ],
                    'workload_distribution' => $this->workloadDistribution($employees),
                    'task_status_distribution' => $this->taskStatusDistribution(),
                ],
            ], 'Workload overview retrieved successfully.');
        });
    }

    public function show(Request $request, User $user)
    {
        return $this->handle(function () use ($request, $user) {
            if ($user->global_role !== 'employee') {
                return $this->errorResponse('Employee not found.', 404);
            }

            $statsUser = User::query()
                ->whereKey($user->id)
                ->withCount([
                    'assignedTasks as active_tasks_count' => fn(Builder $query) => $query->where('status', '!=', 'done'),
                    'assignedTasks as overdue_tasks_count' => fn(Builder $query) => $query
                        ->whereNotNull('due_date')
                        ->whereDate('due_date', '<', now())
                        ->where('status', '!=', 'done'),
                    'assignedTasks as ready_for_review_tasks_count' => fn(Builder $query) => $query
                        ->where('status', 'ready_for_review'),
                    'assignedTasks as completed_this_month_count' => fn(Builder $query) => $query
                        ->where('status', 'done')
                        ->whereBetween('updated_at', [now()->startOfMonth(), now()->endOfMonth()]),
                    'assignedTasks as total_assigned_tasks_count',
                    'assignedTasks as completed_tasks_count' => fn(Builder $query) => $query->where('status', 'done'),
                ])
                ->firstOrFail();

            $statsUser->workload_level = $this->calculateWorkloadLevel((int) $statsUser->active_tasks_count);

            $tasksQuery = $user->assignedTasks()
                ->with(['project', 'parent', 'assignee'])
                ->when($request->filled('status'), fn(Builder $query) => $query->where('status', (string) $request->string('status')))
                ->when($request->filled('priority'), fn(Builder $query) => $query->where('priority', (string) $request->string('priority')))
                ->when($request->boolean('overdue'), fn(Builder $query) => $query
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<', now())
                    ->where('status', '!=', 'done'))
                ->when($request->filled('search'), fn(Builder $query) => $query
                    ->where('title', 'like', '%' . (string) $request->string('search') . '%'))
                ->latest();

            $tasks = $tasksQuery->paginate((int) $request->integer('per_page', 15));

            return $this->successResponse([
                'employee' => WorkloadOverviewResource::make($statsUser),
                'stats' => [
                    'active_tasks' => (int) $statsUser->active_tasks_count,
                    'completed_this_month' => (int) $statsUser->completed_this_month_count,
                    'overdue_tasks' => (int) $statsUser->overdue_tasks_count,
                    'ready_for_review' => (int) $statsUser->ready_for_review_tasks_count,
                    'average_completion_rate' => $this->productivityScore($statsUser),
                    'productivity_score' => $this->productivityScore($statsUser),
                ],
                'charts' => [
                    'assignment_activity' => $this->assignmentActivity($user),
                    'task_status_breakdown' => $this->employeeStatusDistribution($user),
                    'priority_distribution' => $this->employeePriorityDistribution($user),
                ],
                'tasks' => $this->paginate($tasks, EmployeeWorkloadResource::class),
            ], 'Employee workload retrieved successfully.');
        });
    }

    private function calculateWorkloadLevel(int $activeTasks): string
    {
        return match (true) {
            $activeTasks >= 10 => 'overloaded',
            $activeTasks >= 7 => 'high',
            $activeTasks >= 4 => 'medium',
            default => 'low',
        };
    }

    private function productivityScore(User $user): int
    {
        $totalAssignedTasks = (int) ($user->total_assigned_tasks_count ?? 0);

        if ($totalAssignedTasks === 0) {
            return 0;
        }

        return (int) round(((int) $user->completed_tasks_count / $totalAssignedTasks) * 100);
    }

    private function workloadDistribution($employees): array
    {
        return [
            'low' => $employees->where('workload_level', 'low')->count(),
            'medium' => $employees->where('workload_level', 'medium')->count(),
            'high' => $employees->where('workload_level', 'high')->count(),
            'overloaded' => $employees->where('workload_level', 'overloaded')->count(),
        ];
    }

    private function taskStatusDistribution(): array
    {
        return $this->statusCounts(Task::query());
    }

    private function employeeStatusDistribution(User $user): array
    {
        return $this->statusCounts($user->assignedTasks()->getQuery());
    }

    private function employeePriorityDistribution(User $user): array
    {
        $counts = $user->assignedTasks()
            ->select('priority', DB::raw('COUNT(*) as total'))
            ->groupBy('priority')
            ->pluck('total', 'priority');

        return [
            'low' => (int) ($counts['low'] ?? 0),
            'medium' => (int) ($counts['medium'] ?? 0),
            'high' => (int) ($counts['high'] ?? 0),
        ];
    }

    private function statusCounts(Builder $query): array
    {
        $counts = $query
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

    private function assignmentActivity(User $user): array
    {
        return $user->assignedTasks()
            ->selectRaw('YEARWEEK(created_at, 1) as week_key, MIN(DATE(created_at)) as week_start, COUNT(*) as total')
            ->where('created_at', '>=', now()->subWeeks(7)->startOfWeek())
            ->groupBy('week_key')
            ->orderBy('week_key')
            ->get()
            ->map(fn(Task $task) => [
                'label' => (string) $task->week_start,
                'count' => (int) $task->total,
            ])
            ->values()
            ->all();
    }
}
