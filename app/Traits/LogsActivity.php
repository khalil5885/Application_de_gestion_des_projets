<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            self::log($model, 'created');
        });

        static::updated(function ($model) {
            self::log($model, 'updated', $model->getChanges());
        });

        static::deleted(function ($model) {
            self::log($model, 'deleted');
        });
    }

    protected static function log($model, string $action, array $changes = []): void
    {
        ActivityLog::create([
            'user_id'       => auth()->id(),
            'loggable_id'   => $model->id,
            'loggable_type' => get_class($model),
            'action'        => $action,
            'changes'       => empty($changes) ? null : $changes,
        ]);
    }
}