<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $users = User::query()->latest()->paginate(15);

            return $this->successResponse($this->paginate($users, UserResource::class), 'Users retrieved successfully.');
        });
    }

    public function store(StoreUserRequest $request)
    {
        return $this->handle(function () use ($request) {
            $validated = $request->validated();
            $password = $validated['password'] ?? null;
            unset($validated['password']);

            $validated['setup_token'] = $password ? null : Str::uuid()->toString();
            $validated['setup_token_expires_at'] = $password ? null : now()->addDays(7);

            $user = User::create($validated + ['password' => $password]);

            if (method_exists($user, 'syncRoles')) {
                $user->syncRoles([$user->global_role]);
            }

            ActivityLog::record($request->user(), 'user_created', $user, 'User created.', ['global_role' => $user->global_role]);

            return $this->successResponse(UserResource::make($user), 'User created successfully.', 201);
        });
    }

    public function show(User $user)
    {
        return $this->handle(fn () => $this->successResponse(UserResource::make($user), 'User retrieved successfully.'));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        return $this->handle(function () use ($request, $user) {
            $validated = $request->validated();
            $password = $validated['password'] ?? null;
            unset($validated['password']);

            $user->update($validated + array_filter(['password' => $password]));

            if (isset($validated['global_role']) && method_exists($user, 'syncRoles')) {
                $user->syncRoles([$validated['global_role']]);
            }

            ActivityLog::record($request->user(), 'user_updated', $user, 'User updated.', $validated);

            return $this->successResponse(UserResource::make($user->fresh()), 'User updated successfully.');
        });
    }

    public function destroy(User $user)
    {
        return $this->handle(function () use ($user) {
            $actor = request()->user();
            $user->delete();

            ActivityLog::record($actor, 'user_deleted', $user, 'User deleted.');

            return $this->successResponse(null, 'User deleted successfully.');
        });
    }
}
