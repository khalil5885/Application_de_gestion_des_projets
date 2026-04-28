<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_type_id',
        'name',
        'description',
        'default_due_days',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'default_due_days' => 'integer',
            'order' => 'integer',
        ];
    }

    public function projectType(): BelongsTo
    {
        return $this->belongsTo(ProjectType::class);
    }
}
