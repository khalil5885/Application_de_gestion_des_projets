<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\RequestController as AdminRequestController;
use App\Http\Controllers\Admin\ProjectTypeController;
use App\Http\Controllers\Admin\TaskController;
use App\Http\Controllers\Admin\TaskTemplateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WorkloadController;
use App\Http\Controllers\Auth\SetupPasswordController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Client\DashboardController as ClientDashboardController;
use App\Http\Controllers\Client\ProjectController as ClientProjectController;
use App\Http\Controllers\Client\ActivityController as ClientActivityController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\Employee\DashboardController as EmployeeDashboardController;
use App\Http\Controllers\Employee\ProjectController as EmployeeProjectController;
use App\Http\Controllers\Employee\RequestController as EmployeeRequestController;
use App\Http\Controllers\Employee\TaskController as EmployeeTaskController;
use App\Http\Controllers\Employee\WorkspaceController as EmployeeWorkspaceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\TasksOverviewController;
use Illuminate\Support\Facades\Route;

// ─── Public routes ────────────────────────────────────────────────────────────

Route::post('/login', [AuthController::class, 'login']);
Route::post('/setup-password/verify', [SetupPasswordController::class, 'verify']);
Route::post('/setup-password', [SetupPasswordController::class, 'setup']);

// ─── Authenticated (any role) ─────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});

// ─── Admin ────────────────────────────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/activity', [DashboardController::class, 'getRecentActivity']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);

        Route::get('/workload', [WorkloadController::class, 'index']);
        Route::get('/workload/{user}', [WorkloadController::class, 'show']);

        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::patch('/requests/{id}/approve', [AdminRequestController::class, 'approve']);
        Route::patch('/requests/{id}/reject', [AdminRequestController::class, 'reject']);

        Route::get('/tasks-overview', [TasksOverviewController::class, 'index']);

        // Comments
        Route::post('tasks/{task}/comments', [CommentController::class, 'storeOnTask']);
        Route::post('projects/{project}/comments', [CommentController::class, 'storeOnProject']);
        Route::delete('comments/{comment}', [CommentController::class, 'destroy']);

        // Users
        Route::apiResource('users', UserController::class);

        // Projects
        Route::apiResource('projects', ProjectController::class);
        Route::post('projects/{project}/estimate', [ProjectController::class, 'estimate']);
        Route::post('projects/{project}/assignEmployee', [ProjectController::class, 'assignEmployee']);
        Route::delete('projects/{project}/members', [ProjectController::class, 'removeMember']);
        Route::patch('projects/{project}/finalize-review', [ProjectController::class, 'finalizeReview']);

        // Tasks (standalone)
        Route::apiResource('tasks', TaskController::class);
        Route::patch('tasks/{task}/approve', [TaskController::class, 'approveTask']);
        Route::patch('tasks/{task}/reject', [TaskController::class, 'rejectTask']);
        Route::patch('tasks/{task}/assignEmployee', [TaskController::class, 'assignEmployee']);
        Route::patch('tasks/{task}/unassignEmployee', [TaskController::class, 'unassignEmployee']);
        Route::patch('tasks/{task}/finalize-review', [TaskController::class, 'finalizeReview']);

        // Tasks (project-scoped)
        Route::prefix('projects/{project}')->group(function () {
            Route::get('tasks', [TaskController::class, 'index']);
            Route::post('tasks', [TaskController::class, 'store']);
            Route::get('tasks/{task}', [TaskController::class, 'show']);
            Route::put('tasks/{task}', [TaskController::class, 'update']);
            Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
        });

        // Project types & task templates
        Route::apiResource('project-types', ProjectTypeController::class);
        Route::apiResource('project-types.task-templates', TaskTemplateController::class);

        Route::get('task-templates/all', [TaskTemplateController::class, 'allTemplates']);
        Route::apiResource('task-templates', TaskTemplateController::class)
            ->only(['index', 'store', 'show', 'update', 'destroy']);

        Route::patch('project-types/{projectType}/task-templates/{taskTemplate}/unassign', [TaskTemplateController::class, 'unassign']);
        Route::patch('project-types/{projectType}/task-templates/{taskTemplate}/reassign', [TaskTemplateController::class, 'reassign']);
    });

// ─── Employee ─────────────────────────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'role:employee'])
    ->prefix('employee')
    ->group(function () {
        Route::get('/dashboard', [EmployeeDashboardController::class, 'index']);
        Route::get('/workspace/calendar', [EmployeeWorkspaceController::class, 'calendar']);
        Route::get('/workspace/activity', [EmployeeWorkspaceController::class, 'activity']);
        Route::get('/workspace/productivity', [EmployeeWorkspaceController::class, 'productivity']);

        Route::get('/projects', [EmployeeProjectController::class, 'index']);
        Route::get('/projects/{project}', [EmployeeProjectController::class, 'show']);

        Route::get('/tasks', [EmployeeTaskController::class, 'index']);
        Route::patch('/tasks/{task}/mark-ready', [EmployeeTaskController::class, 'markReadyForReview']);
        Route::patch('/tasks/{task}/status', [EmployeeTaskController::class, 'updateStatus']);
        Route::post('/tasks/suggest-order', [EmployeeTaskController::class, 'suggestOrder']);

        Route::post('/requests', [EmployeeRequestController::class, 'store']);

        // Comments
        Route::post('tasks/{task}/comments', [CommentController::class, 'storeOnTask']);
        Route::post('projects/{project}/comments', [CommentController::class, 'storeOnProject']);
        Route::delete('comments/{comment}', [CommentController::class, 'destroy']);
    });

// ─── Client ───────────────────────────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'role:client'])
    ->prefix('client')
    ->group(function () {
        Route::get('/dashboard', [ClientDashboardController::class, 'index']);
        Route::get('/activity', [ClientActivityController::class, 'index']);

        Route::get('/projects', [ClientProjectController::class, 'index']);
        Route::get('/projects/{project}', [ClientProjectController::class, 'show']);
        Route::post('/projects/{project}/comments', [ClientProjectController::class, 'addComment']);
    });