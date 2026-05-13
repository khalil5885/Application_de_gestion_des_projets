<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificationService;

class CommentController extends Controller
{
    /**
     * Create comment on PROJECT
     */
    public function storeOnProject(Request $request, Project $project)
    {
        $data = $request->validate([
            'content' => 'required|string',
            'visibility' => 'nullable|in:public,internal,private'
        ]);

        $this->authorizeProjectAccess($project);

        $comment = $project->comments()->create([
            'user_id'    => Auth::id(),
            'content'       => $data['content'],
            'visibility' => $data['visibility'] ?? 'internal',
        ]);

        $this->notifyProjectComment($project, $comment);

        return response()->json(
            $comment->load('user'),
            201
        );
    }

    /**
     * Create comment on TASK
     */
    public function storeOnTask(Request $request, Task $task)
    {
        $data = $request->validate([
            'content' => 'required|string',
            'visibility' => 'nullable|in:public,internal,private'
        ]);

        $this->authorizeTaskAccess($task);

        $comment = $task->comments()->create([
            'user_id'    => Auth::id(),
            'content'       => $data['content'],
            'visibility' => $data['visibility'] ?? 'internal',
        ]);

        $this->notifyTaskComment($task, $comment);

        return response()->json(
            $comment->load('user'),
            201
        );
    }

    /**
     * Delete comment
     */
    public function destroy(Comment $comment)
    {
        $user = Auth::user();

        abort_unless(
            $comment->user_id === $user->id || $user->global_role === 'admin',
            403
        );

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted.'
        ]);
    }

    /**
     * -----------------------------
     * ACCESS CONTROL
     * -----------------------------
     */

    private function authorizeProjectAccess(Project $project)
    {
        $user = Auth::user();

        if ($user->global_role === 'admin') return;

        if ($user->global_role === 'client') {
            abort_unless($project->client_id === $user->id, 403);
        }

        if ($user->global_role === 'employee') {
            abort_unless(
                $project->users()->where('user_id', $user->id)->exists(),
                403
            );
        }
    }

    private function authorizeTaskAccess(Task $task)
    {
        $user = Auth::user();

        if ($user->global_role === 'admin') return;

        $project = $task->project;

        if ($user->global_role === 'client') {
            abort_unless($project->client_id === $user->id, 403);
        }

        if ($user->global_role === 'employee') {
            abort_unless(
                $project->members()->where('user_id', $user->id)->exists(),
                403
            );
        }
    }

    /**
     * -----------------------------
     * NOTIFICATIONS
     * -----------------------------
     */

    private function notifyProjectComment(Project $project, Comment $comment)
    {
        $user = Auth::user();

        $recipients = $this->getProjectNotificationTargets($project);

        NotificationService::send($recipients, 'comment_added', [
            'type'         => 'project',
            'project_id'   => $project->id,
            'project_name' => $project->name,
            'commenter'    => $user->name,
            'comment_id'   => $comment->id,
        ]);
    }

    private function notifyTaskComment(Task $task, Comment $comment)
    {
        $user = Auth::user();

        $recipients = $this->getProjectNotificationTargets($task->project);

        NotificationService::send($recipients, 'comment_added', [
            'type'       => 'task',
            'task_id'    => $task->id,
            'task_title' => $task->title,
            'commenter'  => $user->name,
            'comment_id' => $comment->id,
        ]);
    }

    /**
     * Who gets notified (IMPORTANT LOGIC)
     */
    private function getProjectNotificationTargets(Project $project)
    {
        $adminIds = User::where('global_role', 'admin')->pluck('id')->toArray();

        $clientId = $project->client_id ? [$project->client_id] : [];

        $employeeIds = $project->members()->pluck('users.id')->toArray();

        return array_unique(array_merge(
            $adminIds,
            $clientId,
            $employeeIds
        ));
    }
}