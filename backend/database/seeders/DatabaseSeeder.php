<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\ProjectType;
use App\Models\Task;
use App\Models\TaskTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'global_role' => 'admin',
                'phone' => '555-0001',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $employee = User::firstOrCreate(
            ['email' => 'employee@example.com'],
            [
                'name' => 'Employee User',
                'password' => Hash::make('password'),
                'global_role' => 'employee',
                'phone' => '555-0002',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $client = User::firstOrCreate(
            ['email' => 'client@example.com'],
            [
                'name' => 'Client User',
                'password' => Hash::make('password'),
                'global_role' => 'client',
                'phone' => '555-0003',
                'is_active' => true,
                'email_verified_at' => now(),
                'setup_token' => Str::uuid()->toString(),
                'setup_token_expires_at' => now()->addDays(7),
            ]
        );

        $projectType = ProjectType::firstOrCreate(
            ['name' => 'Website Redesign'],
            [
                'description' => 'Template for web delivery projects.',
            ]
        );

        TaskTemplate::firstOrCreate(
            [
                'project_type_id' => $projectType->id,
                'name' => 'Discovery',
            ],
            [
                'description' => 'Collect client goals and references.',
                'default_due_days' => 2,
                'order' => 1,
            ]
        );

        TaskTemplate::firstOrCreate(
            [
                'project_type_id' => $projectType->id,
                'name' => 'Design Approval',
            ],
            [
                'description' => 'Review layouts with stakeholders.',
                'default_due_days' => 5,
                'order' => 2,
            ]
        );

        $project = Project::firstOrCreate(
            ['name' => 'Acme Portal'],
            [
                'description' => 'Client dashboard rebuild.',
                'client_id' => $client->id,
                'project_type_id' => $projectType->id,
                'status' => 'todo',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addMonth()->toDateString(),
                'progress' => 0,
            ]
        );

        $project->members()->syncWithoutDetaching([
            $employee->id => ['role' => 'developer'],
        ]);

        $taskOne = Task::firstOrCreate(
            [
                'project_id' => $project->id,
                'title' => 'Discovery',
            ],
            [
                'description' => 'Initial project kickoff and requirements.',
                'status' => 'done',
                'priority' => 'high',
                'due_date' => now()->addDays(2)->toDateString(),
                'assigned_to' => $employee->id,
                'order' => 1,
            ]
        );

        Task::firstOrCreate(
            [
                'project_id' => $project->id,
                'title' => 'Design Approval',
            ],
            [
                'description' => 'Share wireframes with client.',
                'status' => 'in_progress',
                'priority' => 'medium',
                'due_date' => now()->addDays(5)->toDateString(),
                'assigned_to' => $employee->id,
                'order' => 2,
            ]
        );

        $project->refreshProgress();

        $project->comments()->firstOrCreate(
            [
                'user_id' => $client->id,
                'content' => 'Looking forward to the first milestone.',
            ]
        );

        $taskOne->comments()->firstOrCreate(
            [
                'user_id' => $employee->id,
                'content' => 'Requirements gathered and documented.',
            ]
        );

        ActivityLog::firstOrCreate(
            [
                'action' => 'seed_completed',
            ],
            [
                'user_id'        => $admin->id,
                'loggable_type'  => Project::class,
                'loggable_id'    => $project->id,
                'description'    => 'Database seeded with starter data.',
            ]
        );
    }
}