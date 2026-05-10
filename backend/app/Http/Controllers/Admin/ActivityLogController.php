<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    public function index()
    {
        return $this->handle(function () {
            $logs = ActivityLog::query()->with('user')->latest()->paginate(20);

            return $this->successResponse($this->paginate($logs, ActivityLogResource::class), 'Activity logs retrieved successfully.');
        });
    }
}
