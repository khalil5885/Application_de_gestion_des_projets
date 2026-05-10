<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $user = request()->user();
            $projects = $user->memberProjects()
                ->with(['client', 'projectType'])
                ->latest()
                ->paginate(15);

            return $this->successResponse($this->paginate($projects, ProjectResource::class), 'Employee projects retrieved successfully.');
        });
    }

    public function show(Project $project)
    {
        return $this->handle(function () use ($project) {
            $user = request()->user();

            abort_unless($user->memberProjects()->whereKey($project->id)->exists(), 403, 'You are not assigned to this project.');

            $project->load(['client', 'projectType', 'members', 'rootTasks.children.assignee', 'comments.user']);

            return $this->successResponse(ProjectResource::make($project), 'Employee project retrieved successfully.');
        });
    }
}
