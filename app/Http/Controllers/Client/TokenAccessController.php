<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessToken;
use App\Models\Project;
use Illuminate\Http\Request;

class TokenAccessController extends Controller
{
    // Generate a shareable token for a project (Admin calls this)
    public function generate(Request $request, Project $project)
    {
        $request->validate(['expires_in_days' => 'sometimes|integer|min:1|max:30']);

        $token = \Illuminate\Support\Str::random(64);

        $accessToken = ClientAccessToken::create([
            'client_id'  => $project->client_id,
            'project_id' => $project->id,
            'token'      => $token,
            'expires_at' => now()->addDays($request->expires_in_days ?? 7),
        ]);

        $url = config('app.frontend_url') . '/#/access/' . $token;

        return response()->json(['url' => $url, 'expires_at' => $accessToken->expires_at]);
    }

    // Validate token and return project data (public route, no auth needed)
    public function access(string $token)
    {
        $accessToken = ClientAccessToken::where('token', $token)->first();

        if (!$accessToken || $accessToken->isExpired()) {
            return response()->json(['message' => 'Invalid or expired access link.'], 403);
        }

        $project = $accessToken->project->load(['tasks.assignee', 'projectType']);

        return response()->json(['project' => $project]);
    }
}