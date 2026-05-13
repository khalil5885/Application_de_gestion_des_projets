<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Collection;

class NotificationService
{
    public static function send(array|Collection $users, string $type, array $data): void
    {
        $rows = collect($users)->map(fn($user) => [
            'user_id'    => is_object($user) ? $user->id : $user,
            'type'       => $type,
            'data'       => json_encode($data),
            'read_at'    => null,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        Notification::insert($rows); // one query regardless of recipient count
    }
}