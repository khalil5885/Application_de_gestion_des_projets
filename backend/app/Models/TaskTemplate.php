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
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_due_days' => 'integer',
            'order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function projectType(): BelongsTo
    {
        return $this->belongsTo(ProjectType::class);
    }
     public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Scope for inactive (unassigned) templates
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }
}
