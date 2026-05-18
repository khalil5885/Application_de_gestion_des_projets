<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Send notifications to users, with optional role filtering.
     *
     * @param array|Collection $users  Users or user IDs to notify
     * @param string $type             Notification type (e.g. 'task_assigned')
     * @param array $data              Payload data
     * @param array|string|null $onlyRoles  Only send to users with these roles (e.g. ['employee', 'admin'])
     */
    public static function send(
        array|Collection $users,
        string $type,
        array $data,
        array|string|null $onlyRoles = null
    ): void {
        $roleFilter = $onlyRoles ? (array) $onlyRoles : null;

        $rows = collect($users)
            ->filter(function ($user) use ($roleFilter) {
                // Resolve to User model if ID was passed
                $userModel = is_object($user) ? $user : User::find($user);
                
                if (!$userModel) return false;
                
                // Apply role filter if specified
                if ($roleFilter && !in_array($userModel->global_role, $roleFilter)) {
                    return false;
                }
                
                return true;
            })
            ->map(fn($user) => [
                'user_id'    => is_object($user) ? $user->id : $user,
                'type'       => $type,
                'data'       => json_encode($data),
                'read_at'    => null,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        if (empty($rows)) return;

        Notification::insert($rows);
    }

    // ─── Convenience methods for common patterns ─────────────────────────────

    /**
     * Send only to employees (excludes clients).
     */
    public static function sendToEmployees(array|Collection $users, string $type, array $data): void
    {
        self::send($users, $type, $data, 'employee');
    }

    /**
     * Send only to admins.
     */
    public static function sendToAdmins(array|Collection $users, string $type, array $data): void
    {
        self::send($users, $type, $data, 'admin');
    }

    /**
     * Send to both employees and admins (excludes clients).
     */
    public static function sendToStaff(array|Collection $users, string $type, array $data): void
    {
        self::send($users, $type, $data, ['employee', 'admin']);
    }
    /**
 * Send only to clients.
 */
public static function sendToClients(array|Collection $users, string $type, array $data): void
{
    self::send($users, $type, $data, 'client');
}
}