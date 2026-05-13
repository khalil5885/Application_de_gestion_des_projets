<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Request extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'requestable_id',
        'requestable_type',
        'type',
        'payload',
        'status',
        'handled_by',
        'handled_at',
    ];
    public const TYPE_EXTENSION = 'extension';
    public const TYPE_TASK_REVIEW = 'task_review';
    public const TYPE_PROJECT_REVIEW = 'project_review';
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'handled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function requestable(): MorphTo
    {
        return $this->morphTo();
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
