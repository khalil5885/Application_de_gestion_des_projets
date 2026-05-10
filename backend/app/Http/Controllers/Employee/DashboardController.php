<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;

class DashboardController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $user = request()->user();

            $myProjects = Project::whereHas('members', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })
                ->withCount(['tasks', 'tasks as completed_tasks_count' => fn($q) => $q->where('status', 'done')])
                ->get()
                ->map(fn($p) => [
                    'id'       => $p->id,
                    'name'     => $p->name,
                    'status'   => $p->status,
                    'progress' => $p->progress ?? 0,
                ]);

            $upcomingTasks = Task::where('assigned_to', $user->id)
                ->whereIn('status', ['todo', 'in_progress'])
                ->whereNotNull('due_date')
                ->orderBy('due_date')
                ->limit(5)
                ->get(['id', 'title as name', 'status', 'priority', 'due_date']);

            return $this->successResponse([
                'stats' => [
                    'total_tasks'     => Task::where('assigned_to', $user->id)->count(),
                    'completed_tasks' => Task::where('assigned_to', $user->id)->where('status', 'done')->count(),
                    'in_progress'     => Task::where('assigned_to', $user->id)->where('status', 'in_progress')->count(),
                    'todo'            => Task::where('assigned_to', $user->id)->where('status', 'todo')->count(),
                ],
                'my_projects'    => $myProjects,
                'upcoming_tasks' => $upcomingTasks,
            ], 'Employee dashboard retrieved successfully.');
        });
    }
}