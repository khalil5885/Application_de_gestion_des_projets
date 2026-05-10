<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Project;

class DashboardController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $user = request()->user();

            $projects = Project::where('client_id', $user->id)
                ->withCount(['tasks', 'tasks as completed_tasks_count' => fn($q) => $q->where('status', 'done')])
                ->get();

            $projectsMapped = $projects->map(fn($p) => [
                'id'       => $p->id,
                'name'     => $p->name,
                'status'   => $p->status,
                'progress' => $p->progress ?? 0,
            ]);

            return $this->successResponse([
                'stats' => [
                    'total_projects'     => $projects->count(),
                    'active_projects'    => $projects->where('status', 'in_progress')->count(),
                    'completed_projects' => $projects->where('status', 'done')->count(),
                    'avg_progress'       => round($projectsMapped->avg('progress') ?? 0),
                ],
                'projects' => $projectsMapped->values(),
            ], 'Client dashboard retrieved successfully.');
        });
    }
}