<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\HandleRequestRequest;
use App\Http\Resources\RequestResource;
use App\Models\ActivityLog;
use App\Services\NotificationService;
use App\Models\Project;
use App\Models\Request as UserRequest;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RequestController extends Controller
{
    public function index(Request $request)
    {
        return $this->handle(function () {
            $requests = UserRequest::query()
                ->with(['user', 'handledBy', 'requestable'])
                ->latest()
                ->paginate(20);

            return $this->successResponse(
                $this->paginate($requests, RequestResource::class),
                'Requests retrieved successfully.'
            );
        });
    }

    public function approve(HandleRequestRequest $request, int $id)
    {
        return $this->handle(function () use ($request, $id) {
            $userRequest = DB::transaction(function () use ($request, $id) {
                $userRequest = UserRequest::query()
                    ->with(['user', 'requestable'])
                    ->lockForUpdate()
                    ->findOrFail($id);

                abort_unless($userRequest->status === 'pending', 422, 'Only pending requests can be handled.');

                $userRequest->update([
                    'status' => 'approved',
                    'handled_by' => $request->user()->id,
                    'handled_at' => now(),
                ]);

                match ($userRequest->type) {
                    'extension' => $this->applyExtension($userRequest, $request->user()),
                    'task_review' => $this->applyTaskReview($userRequest, $request->user()),
                    'project_review' => $this->applyProjectReview($userRequest, $request->user()),
                    default => abort(422, "Unknown request type: {$userRequest->type}"),
                };

                ActivityLog::record($request->user(), 'request_approved', $userRequest, 'Request approved.');
                $this->notifyEmployee($userRequest, 'request_approved', $request->validated('feedback'));

                return $userRequest->fresh(['user', 'handledBy', 'requestable']);
            });

            return $this->successResponse(
                RequestResource::make($userRequest),
                'Request approved successfully.'
            );
        });
    }

    public function reject(HandleRequestRequest $request, int $id)
    {
        return $this->handle(function () use ($request, $id) {
            $userRequest = DB::transaction(function () use ($request, $id) {
                $userRequest = UserRequest::query()
                    ->with(['user', 'requestable'])
                    ->lockForUpdate()
                    ->findOrFail($id);

                abort_unless($userRequest->status === 'pending', 422, 'Only pending requests can be handled.');

                $payload = $userRequest->payload ?? [];
                if ($request->filled('feedback')) {
                    $payload['feedback'] = $request->validated('feedback');
                }

                $userRequest->update([
                    'status' => 'rejected',
                    'payload' => $payload,
                    'handled_by' => $request->user()->id,
                    'handled_at' => now(),
                ]);

                // Revert status for review requests on rejection
                if (in_array($userRequest->type, ['task_review', 'project_review'])) {
                    $this->revertReviewStatus($userRequest);
                }

                ActivityLog::record($request->user(), 'request_rejected', $userRequest, 'Request rejected.');
                $this->notifyEmployee($userRequest, 'request_rejected', $request->validated('feedback'));

                return $userRequest->fresh(['user', 'handledBy', 'requestable']);
            });

            return $this->successResponse(
                RequestResource::make($userRequest),
                'Request rejected successfully.'
            );
        });
    }

    protected function applyExtension(UserRequest $userRequest, $actor): void
    {
        $requestedDeadline = $userRequest->payload['requested_deadline'] ?? null;
        abort_unless($requestedDeadline, 422, 'Requested deadline is missing.');

        $requestable = $userRequest->requestable;

        if ($requestable instanceof Task) {
            $requestable->update(['due_date' => $requestedDeadline]);
            ActivityLog::record($actor, 'task_deadline_extended', $requestable, 'Task deadline extended.', [
                'request_id' => $userRequest->id,
                'due_date' => $requestedDeadline,
            ]);
            return;
        }

        if ($requestable instanceof Project) {
            $requestable->update(['end_date' => $requestedDeadline]);
            ActivityLog::record($actor, 'project_deadline_extended', $requestable, 'Project deadline extended.', [
                'request_id' => $userRequest->id,
                'end_date' => $requestedDeadline,
            ]);
        }
    }

    protected function applyTaskReview(UserRequest $userRequest, $actor): void
    {
        $requestable = $userRequest->requestable;

        abort_unless($requestable instanceof Task, 422, 'Invalid requestable for task review.');

        $requestable->update(['status' => 'in_review']);

        ActivityLog::record($actor, 'task_submitted_for_review', $requestable, 'Task submitted for review.', [
            'request_id' => $userRequest->id,
        ]);
    }

    protected function applyProjectReview(UserRequest $userRequest, $actor): void
    {
        $requestable = $userRequest->requestable;

        abort_unless($requestable instanceof Project, 422, 'Invalid requestable for project review.');

        $requestable->update(['status' => 'in_review']);

        ActivityLog::record($actor, 'project_submitted_for_review', $requestable, 'Project submitted for review.', [
            'request_id' => $userRequest->id,
        ]);
    }

    protected function revertReviewStatus(UserRequest $userRequest): void
    {
        $requestable = $userRequest->requestable;

        if ($requestable instanceof Task) {
            $requestable->update(['status' => 'rejected']); // or 'needs_revision'
            return;
        }

        if ($requestable instanceof Project) {
            $requestable->update(['status' => 'rejected']); // or 'needs_revision'
        }
    }

    protected function notifyEmployee(UserRequest $userRequest, string $type, ?string $feedback = null): void
    {
        NotificationService::send(
            [$userRequest->user_id],
            $type,
            [
                'request_id' => $userRequest->id,
                'status' => $userRequest->status,
                'feedback' => $feedback,
            ]
        );
    }
}