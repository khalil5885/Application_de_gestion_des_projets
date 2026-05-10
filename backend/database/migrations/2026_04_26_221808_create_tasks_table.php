<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TasksOverviewController extends Controller
{
    public function index(Request $request)
    {
        return $this->handle(function () use ($request) {
            $query = Task::query()
                ->with(['project.client', 'assignee', 'comments.user'])
                ->whereNull('parent_id');

            if ($request->has('status')) {
                $query->whereIn('status', explode(',', $request->input('status')));
            }

            if ($request->filled('employee_id')) {
                $query->where('assigned_to', $request->input('employee_id'));
            }

            if ($request->filled('project_id')) {
                $query->where('project_id', $request->input('project_id'));
            }

            if ($request->filled('priority')) {
                $query->where('priority', $request->input('priority'));
            }

            if ($request->filled('from')) {
                $query->whereDate('due_date', '>=', $request->input('from'));
            }

            if ($request->filled('to')) {
                $query->whereDate('due_date', '<=', $request->input('to'));
            }

            if ($request->boolean('overdue')) {
                $query->whereDate('due_date', '<', now())
                      ->where('status', '!=', 'done');
            }

            if ($request->filled('search')) {
                $query->where('title', 'like', '%' . $request->input('search') . '%');
            }

            $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
                  ->orderBy('due_date', 'asc');

            $paginated = $query->paginate(20);

            $allTasks = Task::whereNull('parent_id');

            return $this->successResponse([
                'items'                => TaskResource::collection($paginated),
                'current_page'         => $paginated->currentPage(),
                'last_page'            => $paginated->lastPage(),
                'total'                => $paginated->total(),
                'total_tasks'          => (clone $allTasks)->count(),
                'active_tasks'         => (clone $allTasks)->whereIn('status', ['todo', 'in_progress', 'ready_for_review'])->count(),
                'overdue_tasks'        => (clone $allTasks)->whereDate('due_date', '<', now())->where('status', '!=', 'done')->count(),
                'ready_for_review_tasks' => (clone $allTasks)->where('status', 'ready_for_review')->count(),
                'completed_this_week'  => (clone $allTasks)->where('status', 'done')->where('updated_at', '>=', Carbon::now()->startOfWeek())->count(),
            ], 'Tasks overview retrieved successfully.');
        });
    }
}