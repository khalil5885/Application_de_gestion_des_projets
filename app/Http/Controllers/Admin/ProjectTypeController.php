<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectTypeRequest;
use App\Http\Requests\Admin\UpdateProjectTypeRequest;
use App\Http\Resources\ProjectTypeResource;
use App\Models\ActivityLog;
use App\Models\ProjectType;

class ProjectTypeController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $types = ProjectType::query()->with('taskTemplates')->latest()->paginate(15);

            return $this->successResponse($this->paginate($types, ProjectTypeResource::class), 'Project types retrieved successfully.');
        });
    }

    public function store(StoreProjectTypeRequest $request)
    {
        return $this->handle(function () use ($request) {
            $type = ProjectType::create($request->validated());
            ActivityLog::record($request->user(), 'project_type_created', $type, 'Project type created.');

            return $this->successResponse(ProjectTypeResource::make($type), 'Project type created successfully.', 201);
        });
    }

    public function show(ProjectType $projectType)
    {
        return $this->handle(function () use ($projectType) {
            $projectType->load('taskTemplates');

            return $this->successResponse(ProjectTypeResource::make($projectType), 'Project type retrieved successfully.');
        });
    }

    public function update(UpdateProjectTypeRequest $request, ProjectType $projectType)
    {
        return $this->handle(function () use ($request, $projectType) {
            $projectType->update($request->validated());
            ActivityLog::record($request->user(), 'project_type_updated', $projectType, 'Project type updated.', $request->validated());

            return $this->successResponse(ProjectTypeResource::make($projectType->fresh()->load('taskTemplates')), 'Project type updated successfully.');
        });
    }

    public function destroy(ProjectType $projectType)
    {
        return $this->handle(function () use ($projectType) {
            $actor = request()->user();
            $projectType->delete();
            ActivityLog::record($actor, 'project_type_deleted', $projectType, 'Project type deleted.');

            return $this->successResponse(null, 'Project type deleted successfully.');
        });
    }
}
