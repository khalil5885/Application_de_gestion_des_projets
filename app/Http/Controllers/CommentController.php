<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function storeOnProject(Request $request, Project $project)
    {
        $data = $request->validate(['body' => 'required|string']);

        $comment = $project->comments()->create([
            'user_id' => auth()->id(),
            'body'    => $data['body'],
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function storeOnTask(Request $request, Task $task)
    {
        $data = $request->validate(['body' => 'required|string']);

        $comment = $task->comments()->create([
            'user_id' => auth()->id(),
            'body'    => $data['body'],
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function destroy(Comment $comment)
    {
        abort_if($comment->user_id !== auth()->id() && auth()->user()->role !== 'admin', 403);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}