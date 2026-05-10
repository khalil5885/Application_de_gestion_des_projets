<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_type_id' => $this->project_type_id,
            'name' => $this->name,
            'description' => $this->description,
            'default_due_days' => $this->default_due_days,
            'order' => $this->order,
            'project_type' => ProjectTypeResource::make($this->whenLoaded('projectType')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
