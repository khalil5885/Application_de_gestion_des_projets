<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkloadOverviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeTasks = (int) ($this->active_tasks_count ?? 0);
        $totalAssignedTasks = (int) ($this->total_assigned_tasks_count ?? 0);
        $completedTasks = (int) ($this->completed_tasks_count ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'active_tasks_count' => $activeTasks,
            'overdue_tasks_count' => (int) ($this->overdue_tasks_count ?? 0),
            'ready_for_review_tasks_count' => (int) ($this->ready_for_review_tasks_count ?? 0),
            'ready_for_review_count' => (int) ($this->ready_for_review_tasks_count ?? 0),
            'completed_this_month_count' => (int) ($this->completed_this_month_count ?? 0),
            'completed_tasks_this_month' => (int) ($this->completed_this_month_count ?? 0),
            'workload_level' => $this->workload_level,
            'productivity_score' => $totalAssignedTasks > 0
                ? (int) round(($completedTasks / $totalAssignedTasks) * 100)
                : 0,
        ];
    }
}

