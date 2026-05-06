<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'requestable_id' => $this->requestable_id,
            'requestable_type' => class_basename($this->requestable_type),
            'type' => $this->type,
            'payload' => $this->payload,
            'status' => $this->status,
            'handled_by' => $this->handled_by,
            'handled_at' => $this->handled_at?->toISOString(),
            'user' => UserResource::make($this->whenLoaded('user')),
            'handler' => UserResource::make($this->whenLoaded('handledBy')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
