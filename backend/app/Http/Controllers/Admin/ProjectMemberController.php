<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function index(Project $project)
    {
        return response()->json($project->employees()->with('employee')->get());
    }

    public function store(Request $request, Project $project)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:users,id',
            'role' => 'sometimes|string|max:100',
        ]);

        $member = ProjectMember::firstOrCreate(
            ['project_id' => $project->id, 'employee_id' => $data['employee_id']],
            ['role' => $data['role'] ?? 'developer']
        );

       NotificationService::send([$data['employee_id']], 'project_assigned', [
    'project_id'   => $project->id,
    'project_name' => $project->name,
]);

        return response()->json($member->load('employee'), 201);
    }

    public function destroy(Request $request, Project $project)
    {
        $request->validate([
            'member_id' => 'required|exists:project_members,id',
        ]);

        ProjectMember::where('id', $request->member_id)->delete();
        return response()->json(['message' => 'Member removed.']);
    }
}