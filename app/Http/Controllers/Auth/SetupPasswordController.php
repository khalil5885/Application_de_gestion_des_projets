<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SetupPasswordRequest;
use App\Http\Requests\Auth\SetupPasswordVerifyRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Carbon;

class SetupPasswordController extends Controller
{
    public function verify(SetupPasswordVerifyRequest $request)
    {
        return $this->handle(function () use ($request) {
            $user = $this->findUserBySetupToken($request->validated('token'));

            if (! $user) {
                return $this->errorResponse('Invalid or expired setup token.', 404);
            }

            return $this->successResponse([
                'user' => UserResource::make($user)->resolve(),
                'token_valid' => true,
            ], 'Setup token is valid.');
        });
    }

    public function setup(SetupPasswordRequest $request)
    {
        return $this->handle(function () use ($request) {
            $validated = $request->validated();
            $user = $this->findUserBySetupToken($validated['token']);

            if (! $user) {
                return $this->errorResponse('Invalid or expired setup token.', 404);
            }

            $user->forceFill([
                'password' => $validated['password'],
                'setup_token' => null,
                'setup_token_expires_at' => null,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            ActivityLog::record($user, 'password_setup', $user, 'User completed password setup.');

            return $this->successResponse(UserResource::make($user), 'Password setup completed.');
        });
    }

    protected function findUserBySetupToken(string $token): ?User
    {
        return User::query()
            ->where('setup_token', $token)
            ->where('setup_token_expires_at', '>=', Carbon::now())
            ->first();
    }
}
