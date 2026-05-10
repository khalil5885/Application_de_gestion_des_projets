<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\Task;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        return $this->handle(function () use ($request) {

            $user = $request->user();

            $activities = ActivityLog::query()

                ->with([
                    'user',
                    'loggable'
                ])

                ->where(function ($query) use ($user) {

                    /*
                    |--------------------------------------------------------------------------
                    | Project Activities
                    |--------------------------------------------------------------------------
                    */

                    $query->whereHasMorph(
                        'loggable',
                        ['App\Models\Project'],
                        function ($projectQuery) use ($user) {

                            $projectQuery->where('client_id', $user->id);
                        }
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Milestone Task Activities
                    |--------------------------------------------------------------------------
                    */

                    $query->orWhereHasMorph(
                        'loggable',
                        [Task::class],
                        function ($taskQuery) use ($user) {

                            $taskQuery
                                ->whereNull('parent_id') // only milestones
                                ->whereHas('project', function ($projectQuery) use ($user) {

                                    $projectQuery->where('client_id', $user->id);
                                });
                        }
                    );
                })

                /*
                |--------------------------------------------------------------------------
                | Allowed Client Activity Types
                |--------------------------------------------------------------------------
                */

                ->whereIn('action', [
                    'project_created',
                    'project_updated',
                    'project_completed',

                    'task_completed',
                    'task_ready_for_review',
                    'task_approved',

                    'comment_created',
                ])

                ->latest()

                ->paginate(15);

            return $this->successResponse(
                ActivityLogResource::collection($activities),
                'Client activity retrieved successfully.'
            );
        });
    }
}