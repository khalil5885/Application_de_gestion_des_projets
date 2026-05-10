<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;

class CommentController extends Controller
{
    public function addTaskComment(StoreCommentRequest $request, Task $task)
    {
        return $this->handle(function () use ($request, $task) {
            abort_unless($task->assigned_to === $request->user()->id, 403, 'You are not assigned to this task.');

            $comment = $task->comments()->create([
                'user_id' => $request->user()->id,
                'content' => $request->validated('content'),
            ]);

            ActivityLog::record($request->user(), 'task_comment_created', $task, 'Employee added a task comment.');

            return $this->successResponse(CommentResource::make($comment->load('user')), 'Task comment added successfully.', 201);
        });
    }

    public function addProjectComment(StoreCommentRequest $request, Project $project)
    {
        return $this->handle(function () use ($request, $project) {
            abort_unless($request->user()->memberProjects()->whereKey($project->id)->exists(), 403, 'You are not assigned to this project.');

            $comment = $project->comments()->create([
                'user_id' => $request->user()->id,
                'content' => $request->validated('content'),
            ]);

            ActivityLog::record($request->user(), 'project_comment_created', $project, 'Employee added a project comment.');

            return $this->successResponse(CommentResource::make($comment->load('user')), 'Project comment added successfully.', 201);
        });
    }
}
