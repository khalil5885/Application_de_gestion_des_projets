<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Get authenticated user notifications.
     */
    public function index(Request $request): JsonResponse
{
    $query = $request->user()
        ->notifications()
        ->latest();

    // filter by type group: 'requests' maps to request-related notification types
    if ($request->filled('type')) {
        match ($request->input('type')) {
            'requests' => $query->whereIn('type', [
                'request_created',
                'request_approved',
                'request_rejected',
            ]),
            'tasks'    => $query->where('type', 'like', 'task%'),
            default    => $query->where('type', $request->input('type')),
        };
    }

    $notifications = $query->paginate(20);

    return response()->json([
        'status'  => 'success',
        'message' => 'Notifications retrieved successfully.',
        'data'    => $notifications,
    ]);
}

    /**
     * Mark single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        if (is_null($notification->read_at)) {
            $notification->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read.',
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()
            ->notifications()
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Get unread notifications count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()
            ->notifications()
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'count' => $count,
            ],
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification deleted successfully.',
        ]);
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $request->user()
            ->notifications()
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications cleared successfully.',
        ]);
    }
}