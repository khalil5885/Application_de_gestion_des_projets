<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        return $this->handle(function () {

            $recentActivity = ActivityLog::with('user')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($log) => [
                    'id'          => $log->id,
                    'description' => $log->description ?? $log->action ?? '',
                    'created_at'  => $log->created_at,
                    'user'        => $log->user ? [
                        'id'   => $log->user->id,
                        'name' => $log->user->name,
                    ] : null,
                ]);

            $upcomingDeadlines = Task::with('project')
                ->whereIn('status', ['todo', 'in_progress'])
                ->whereNotNull('due_date')
                ->where('due_date', '>=', now())
                ->orderBy('due_date')
                ->limit(5)
                ->get()
                ->map(fn($t) => [
                    'id'           => $t->id,
                    'name'         => $t->title,
                    'due_date'     => $t->due_date,
                    'priority'     => $t->priority,
                    'project_name' => $t->project?->name,
                ]);

            return $this->successResponse([
                'stats' => [
                    'active_projects'    => Project::where('status', 'in_progress')->count(),
                    'new_projects_month' => Project::where('created_at', '>=', now()->startOfMonth())->count(),
                    'completed_tasks'    => Task::where('status', 'done')->count(),
                    'new_tasks_week'     => Task::where('status', 'done')
                                               ->where('updated_at', '>=', now()->startOfWeek())
                                               ->count(),
                    'pending_tasks'      => Task::whereIn('status', ['todo', 'in_progress'])->count(),
                    'total_members'      => User::where('global_role', 'employee')->count(),
                ],
                'recent_activity'    => $recentActivity,
                'upcoming_deadlines' => $upcomingDeadlines,
            ], 'Admin dashboard retrieved successfully.');
        });
    }
}