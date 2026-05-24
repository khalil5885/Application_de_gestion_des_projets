<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class CommentController extends Controller
{
    public function storeOnProject(StoreCommentRequest $request, Project $project)
    {
        $this->authorizeProjectAccess($project);

        $comment = $project->comments()->create([
            'user_id'    => Auth::id(),
            'content'    => trim($request->input('content', '')),
            'visibility' => $request->input('visibility', 'internal'),
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store("comments/{$comment->id}", 'public');
                $comment->attachments()->create([
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        $comment->load('user');
        $this->notifyProjectComment($project, $comment);

        return response()->json(['data' => CommentResource::make($comment)], 201);
    }

    public function storeOnTask(StoreCommentRequest $request, Task $task)
    {
        $this->authorizeTaskAccess($task);

        $comment = $task->comments()->create([
            'user_id'    => Auth::id(),
            'content'    => trim($request->input('content', '')),
            'visibility' => $request->input('visibility', 'internal'),
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store("comments/{$comment->id}", 'public');
                $comment->attachments()->create([
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        $comment->load('user');
        $this->notifyTaskComment($task, $comment);

        return response()->json(['data' => CommentResource::make($comment)], 201);
    }

    public function destroy(Comment $comment)
    {
        $user = Auth::user();
        abort_unless($comment->user_id === $user->id || $user->global_role === 'admin', 403);

        foreach ($comment->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $comment->delete();
        return response()->json(['message' => 'Comment deleted.']);
    }

    private function authorizeProjectAccess(Project $project): void
    {
        $user = Auth::user();
        if ($user->global_role === 'admin') return;
        if ($user->global_role === 'client') abort_unless($project->client_id === $user->id, 403);
        if ($user->global_role === 'employee') abort_unless($project->members()->where('user_id', $user->id)->exists(), 403);
    }

    private function authorizeTaskAccess(Task $task): void
    {
        $user = Auth::user();
        if ($user->global_role === 'admin') return;
        $project = $task->project;
        if ($user->global_role === 'client') abort_unless($project->client_id === $user->id, 403);
        if ($user->global_role === 'employee') abort_unless($project->members()->where('user_id', $user->id)->exists(), 403);
    }

    private function notifyProjectComment(Project $project, Comment $comment): void
    {
        NotificationService::send($this->getProjectNotificationTargets($project), 'comment_added', [
            'type' => 'project', 'project_id' => $project->id,
            'project_name' => $project->name, 'commenter' => Auth::user()->name, 'comment_id' => $comment->id,
        ]);
    }

    private function notifyTaskComment(Task $task, Comment $comment): void
    {
        NotificationService::send($this->getTaskNotificationTargets($task), 'comment_added', [
            'type' => 'task', 'task_id' => $task->id,
            'task_title' => $task->title, 'commenter' => Auth::user()->name, 'comment_id' => $comment->id,
        ]);
    }

    private function getProjectNotificationTargets(Project $project): array
    {
        return array_unique(array_merge(
            User::where('global_role', 'admin')->pluck('id')->toArray(),
            $project->client_id ? [$project->client_id] : [],
            $project->members()->pluck('users.id')->toArray()
        ));
    }

    private function getTaskNotificationTargets(Task $task): array
    {
        $project = $task->project;
        return array_unique(array_merge(
            User::where('global_role', 'admin')->pluck('id')->toArray(),
            $project?->client_id ? [$project->client_id] : [],
            $project?->members()->pluck('users.id')->toArray() ?? []
        ));
    }
}