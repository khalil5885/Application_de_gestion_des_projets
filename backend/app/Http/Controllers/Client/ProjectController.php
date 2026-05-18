<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Http\Resources\ProjectResource;
use App\Models\ActivityLog;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $projects = Project::query()
                ->where('client_id', request()->user()->id)
                ->with(['client', 'projectType'])
                ->latest()
                ->paginate(15);

            return $this->successResponse($this->paginate($projects, ProjectResource::class), 'Client projects retrieved successfully.');
        });
    }

    public function show(Project $project)
    {
        return $this->handle(function () use ($project) {
            abort_unless($project->client_id === request()->user()->id, 403, 'You are not allowed to view this project.');

            $project->load(['client', 'projectType', 'members', 'rootTasks.children.assignee', 'comments.user']);

            return $this->successResponse(ProjectResource::make($project), 'Client project retrieved successfully.');
        });
    }

    // public function addComment(StoreCommentRequest $request, Project $project)
    // {
    //     return $this->handle(function () use ($request, $project) {
    //         abort_unless($project->client_id === $request->user()->id, 403, 'You are not allowed to comment on this project.');

    //         $comment = $project->comments()->create([
    //             'user_id' => $request->user()->id,
    //             'content' => $request->validated('content'),
    //         ]);

    //         ActivityLog::record($request->user(), 'project_comment_created', $project, 'Client added a project comment.');

    //         return $this->successResponse(CommentResource::make($comment->load('user')), 'Project comment added successfully.', 201);
    //     });
    // }
}
