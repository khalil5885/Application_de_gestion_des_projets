<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'content'     => $this->content,
            'visibility'  => $this->visibility,
            'user'        => UserResource::make($this->whenLoaded('user')),
            'attachments' => $this->attachments->map(fn($att) => [
                'id'        => $att->id,
                'file_name' => $att->file_name,
                'file_path' => $att->file_path,
                'mime_type' => $att->mime_type,
                'file_size' => $att->file_size,
                'url'       => $att->url,
                'name'      => $att->name,
            ])->values(),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}