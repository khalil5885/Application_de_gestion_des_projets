<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\StoreRequestRequest;
use App\Http\Resources\RequestResource;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Project;
use App\Models\Request as UserRequest;
use App\Models\Task;
use App\Models\User;

class RequestController extends Controller
{
    public function store(StoreRequestRequest $request)
    {
        return $this->handle(function () use ($request) {
            $requestable = $this->resolveRequestable($request);
            $this->authorizeEmployeeRequest($request->user(), $requestable);

            $userRequest = UserRequest::create([
                'user_id' => $request->user()->id,
                'requestable_id' => $requestable->id,
                'requestable_type' => get_class($requestable),
                'type' => 'extension',
                'payload' => $request->validated('payload'),
                'status' => 'pending',
            ]);

            User::query()
                ->where('global_role', 'admin')
                ->get()
                ->each(function (User $admin) use ($userRequest, $requestable) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'type' => 'request_created',
                        'data' => [
                            'request_id' => $userRequest->id,
                            'request_type' => $userRequest->type,
                            'requestable_type' => class_basename($requestable),
                            'requestable_id' => $requestable->id,
                        ],
                    ]);
                });

            ActivityLog::record($request->user(), 'request_created', $userRequest, 'Employee created an extension request.');

            return $this->successResponse(
                RequestResource::make($userRequest->load(['user', 'handledBy'])),
                'Request created successfully.',
                201
            );
        });
    }

    protected function resolveRequestable(StoreRequestRequest $request): Task|Project
    {
        $requestableClass = $request->requestableClass();

        return $requestableClass::findOrFail($request->validated('requestable_id'));
    }

    protected function authorizeEmployeeRequest(User $user, Task|Project $requestable): void
    {
        if ($requestable instanceof Task) {
            abort_unless($requestable->assigned_to === $user->id, 403, 'You are not assigned to this task.');
            return;
        }

        abort_unless(
            $user->memberProjects()->whereKey($requestable->id)->exists(),
            403,
            'You are not assigned to this project.'
        );
    }
   
}
