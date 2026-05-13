<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'parent_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'assigned_to',
        'order',
        'progress',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'order' => 'integer',
            'progress' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (Task $task) {

            // Refresh own progress
            $task->refreshProgress();

            // Refresh parent progress recursively
            if ($task->parent) {
                $task->parent->refreshProgress();
            }

            // Refresh project progress
            $task->project?->refreshProgress();
        });

        static::deleted(function (Task $task) {

            if ($task->parent) {
                $task->parent->refreshProgress();
            }

            $task->project?->refreshProgress();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id')
            ->with(['children', 'assignee'])
            ->orderBy('order');
    }

    

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function requests(): MorphMany
    {
        return $this->morphMany(Request::class, 'requestable');
    }

    /*
    |--------------------------------------------------------------------------
    | Progress System
    |--------------------------------------------------------------------------
    */

    public function hasSubtasks(): bool
    {
        if ($this->relationLoaded('children')) {
            return $this->children->isNotEmpty();
        }

        return $this->children()->exists();
    }

    public function calculateProgress(): int
    {
        // Parent task progress from children
        if ($this->hasSubtasks()) {

            $children = $this->children;

            if ($children->count() === 0) {
                return 0;
            }

            $totalProgress = $children->sum(function ($child) {
                return $child->calculateProgress();
            });

            return (int) round($totalProgress / $children->count());
        }

        // Leaf task progress from status
        return match ($this->status) {
            'done' => 100,
            'ready_for_review' => 90,
            'in_progress' => 50,
            'todo' => 0,
            'on_hold' => 0,
            default => 0,
        };
    }

    public function refreshProgress(): void
    {
        $newProgress = $this->calculateProgress();

        if ($this->progress !== $newProgress) {

            $this->updateQuietly([
                'progress' => $newProgress,
            ]);
        }

        // Recursively refresh parent
        if ($this->parent) {
            $this->parent->refreshProgress();
        }
    }
    public function isMilestone(): bool
{
    return $this->parent_id === null;
    
}

}