<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        return $this->handle(function () use ($request) {
            $credentials = $request->validated();

            if (! Auth::attempt($credentials)) {
                return $this->errorResponse('Invalid credentials.', 401);
            }

            $user = $request->user();

            if (! $user->is_active) {
                return $this->errorResponse('This account is inactive.', 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return $this->successResponse([
                'token' => $token,
                'user' => UserResource::make($user)->resolve(),
            ], 'Login successful.');
        });
    }

    public function logout()
    {
        return $this->handle(function () {
            $user = request()->user();
            $user?->currentAccessToken()?->delete();

            return $this->successResponse(null, 'Logout successful.');
        });
    }

    public function user()
    {
        return $this->handle(function () {
            return $this->successResponse(UserResource::make(request()->user()), 'Authenticated user retrieved.');
        });
    }
}
