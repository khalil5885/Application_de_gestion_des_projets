<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\RequestController as AdminRequestController;
use App\Http\Controllers\Admin\ProjectTypeController;
use App\Http\Controllers\Admin\TaskController;
use App\Http\Controllers\Admin\TaskTemplateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\SetupPasswordController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Client\DashboardController as ClientDashboardController;
use App\Http\Controllers\Client\ProjectController as ClientProjectController;
use App\Http\Controllers\Employee\CommentController as EmployeeCommentController;
use App\Http\Controllers\Employee\DashboardController as EmployeeDashboardController;
use App\Http\Controllers\Employee\ProjectController as EmployeeProjectController;
use App\Http\Controllers\Employee\RequestController as EmployeeRequestController;
use App\Http\Controllers\Employee\TaskController as EmployeeTaskController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
Route::post('/setup-password/verify', [SetupPasswordController::class, 'verify']);
Route::post('/setup-password', [SetupPasswordController::class, 'setup']);

Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/activity', [DashboardController::class, 'getRecentActivity']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/requests', [AdminRequestController::class, 'index']);
        Route::patch('/requests/{id}/approve', [AdminRequestController::class, 'approve']);
        Route::patch('/requests/{id}/reject', [AdminRequestController::class, 'reject']);
        Route::apiResource('users', UserController::class);
        Route::apiResource('projects', ProjectController::class);
        Route::post('projects/{project}/estimate', [ProjectController::class, 'estimate']);
        Route::post('projects/{project}/assignEmployee', [ProjectController::class, 'assignEmployee']);
        Route::apiResource('tasks', TaskController::class);
        Route::patch('tasks/{task}/approve', [TaskController::class, 'approveTask']);
        Route::patch('tasks/{task}/reject', [TaskController::class, 'rejectTask']);
        Route::patch('tasks/{task}/assignEmployee', [TaskController::class, 'assignEmployee']);
        Route::patch('tasks/{task}/unassignEmployee', [TaskController::class, 'unassignEmployee']);
        Route::delete('projects/{project}/members', [ProjectController::class, 'removeMember']);
        Route::apiResource('project-types', ProjectTypeController::class);
        // NEW: Soft unassign/reassign routes
        Route::patch('project-types/{projectType}/task-templates/{taskTemplate}/unassign', [TaskTemplateController::class, 'unassign']);
        Route::patch('project-types/{projectType}/task-templates/{taskTemplate}/reassign', [TaskTemplateController::class, 'reassign']);

        // NEW: Dedicated task templates page (all templates, including inactive)
        Route::get('task-templates/all', [TaskTemplateController::class, 'allTemplates']);

        // Keep standalone task-templates resource for dedicated page
        Route::apiResource('task-templates', TaskTemplateController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
        Route::apiResource('project-types.task-templates', TaskTemplateController::class);
        Route::prefix('projects/{project}')->group(function () {
            Route::get('tasks', [TaskController::class, 'index']);
            Route::post('tasks', [TaskController::class, 'store']);
            Route::get('tasks/{task}', [TaskController::class, 'show']);
            Route::put('tasks/{task}', [TaskController::class, 'update']);
            Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
        });
    });

Route::middleware(['auth:sanctum', 'role:employee'])->prefix('employee')->group(function () {
    Route::get('/dashboard', [EmployeeDashboardController::class, 'index']);
    Route::get('/projects', [EmployeeProjectController::class, 'index']);
    Route::get('/projects/{project}', [EmployeeProjectController::class, 'show']);
    Route::post('/requests', [EmployeeRequestController::class, 'store']);
    Route::get('/tasks', [EmployeeTaskController::class, 'index']);
    Route::patch('/tasks/{task}/mark-ready', [EmployeeTaskController::class, 'markReadyForReview']);
    Route::patch('/tasks/{task}/status', [EmployeeTaskController::class, 'updateStatus']);
    Route::post('/tasks/{task}/comments', [EmployeeCommentController::class, 'addTaskComment']);
    Route::post('/projects/{project}/comments', [EmployeeCommentController::class, 'addProjectComment']);
});

Route::middleware(['auth:sanctum', 'role:client'])->prefix('client')->group(function () {
    Route::get('/projects', [ClientProjectController::class, 'index']);
    Route::get('/projects/{project}', [ClientProjectController::class, 'show']);
    Route::post('/projects/{project}/comments', [ClientProjectController::class, 'addComment']);
    Route::get('/dashboard', [ClientDashboardController::class, 'index']);
});
