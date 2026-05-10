<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'due_date' => $this->due_date?->toDateString(),
            'assigned_to' => $this->assigned_to,
            'order' => $this->order,
            // ── NEW: fields required by Tasks Overview frontend ──
            'progress' => $this->progress ?? $this->calculateProgress(),
            'overdue' => $this->isOverdue(),
            'completed_at' => $this->status === 'done' ? $this->updated_at?->toISOString() : null,
            // Relations
            'assignee' => UserResource::make($this->whenLoaded('assignee')),
            'children' => TaskResource::collection($this->whenLoaded('children')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'project' => [
                'id'   => $this->project?->id,
                'name' => $this->project?->name,
                'client' => $this->project?->client ? [
                    'id'   => $this->project->client->id,
                    'name' => $this->project->client->name,
                ] : null,
            ],
            'assigned_employee_name' => $this->assignee?->name,
        ];
    }

    /**
     * Calculate task progress based on status or subtask completion.
     */
    protected function calculateProgress(): int
    {
        // Done = 100%
        if ($this->status === 'done') {
            return 100;
        }

        // If has children, calculate from subtask completion
        if ($this->relationLoaded('children') && $this->children->isNotEmpty()) {
            $total = $this->children->count();
            $done = $this->children->where('status', 'done')->count();
            return $total > 0 ? (int) round(($done / $total) * 100) : 0;
        }

        // Map status to approximate progress
        return match ($this->status) {
            'in_progress' => 50,
            'ready_for_review' => 90,
            'on_hold' => 0,
            default => 0,
        };
    }

    /**
     * Check if task is overdue (due date passed and not done).
     */
    protected function isOverdue(): bool
    {
        if (!$this->due_date) {
            return false;
        }

        return $this->due_date->isPast() && $this->status !== 'done';
    }
}
