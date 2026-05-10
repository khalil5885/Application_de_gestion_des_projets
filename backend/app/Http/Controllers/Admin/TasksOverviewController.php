<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TasksOverviewController extends Controller
{
    public function index(Request $request)
    {
        return $this->handle(function () use ($request) {
            $query = Task::query()
                ->with(['project.client', 'assignee', 'project', 'comments.user'])
                ->whereNull('parent_id'); // Only top-level tasks

            // ── Status filter (multi) ──────────────────────────────
            if ($request->has('status')) {
                $statuses = explode(',', $request->input('status'));
                $query->whereIn('status', $statuses);
            }

            // ── Employee filter ──────────────────────────────────
            if ($request->filled('employee_id')) {
                $query->where('assigned_to', $request->input('employee_id'));
            }

            // ── Owner filter (task creator or project owner) ─────
            if ($request->filled('owner_id')) {
                $ownerId = $request->input('owner_id');
                $query->where(function ($q) use ($ownerId) {
                    $q->where('created_by', $ownerId)
                      ->orWhereHas('project', fn($pq) => $pq->where('owner_id', $ownerId));
                });
            }

            // ── Project filter ───────────────────────────────────
            if ($request->filled('project_id')) {
                $query->where('project_id', $request->input('project_id'));
            }

            // ── Priority filter ────────────────────────────────────
            if ($request->filled('priority')) {
                $query->where('priority', $request->input('priority'));
            }

            // ── Date range ───────────────────────────────────────
            if ($request->filled('from')) {
                $query->whereDate('due_date', '>=', $request->input('from'));
            }
            if ($request->filled('to')) {
                $query->whereDate('due_date', '<=', $request->input('to'));
            }

            // ── Overdue toggle ───────────────────────────────────
            if ($request->boolean('overdue')) {
                $query->whereDate('due_date', '<', now())
                      ->where('status', '!=', 'done');
            }

            // ── Search (title) ───────────────────────────────────
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where('title', 'like', "%{$search}%");
            }

            // Order by priority and due date
            $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
                  ->orderBy('due_date', 'asc');

            $paginated = $query->paginate(20);

            // ── KPI calculations ─────────────────────────────────
            $allTasks = Task::whereNull('parent_id');
            $activeStatuses = ['todo', 'in_progress', 'ready_for_review'];

            $totalTasks = (clone $allTasks)->count();
            $activeTasks = (clone $allTasks)->whereIn('status', $activeStatuses)->count();
            $overdueTasks = (clone $allTasks)
                ->whereDate('due_date', '<', now())
                ->where('status', '!=', 'done')
                ->count();
            $readyForReview = (clone $allTasks)->where('status', 'ready_for_review')->count();
            $completedThisWeek = (clone $allTasks)
                ->where('status', 'done')
                ->where('updated_at', '>=', Carbon::now()->startOfWeek())
                ->count();

            return $this->successResponse([
                'items' => TaskResource::collection($paginated),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
                'total_tasks' => $totalTasks,
                'active_tasks' => $activeTasks,
                'overdue_tasks' => $overdueTasks,
                'ready_for_review_tasks' => $readyForReview,
                'completed_this_week' => $completedThisWeek,
            ], 'Tasks overview retrieved successfully.');
        });
    }
}