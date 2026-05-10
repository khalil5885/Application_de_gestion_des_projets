<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id', 'action', 'description',
        'loggable_id', 'loggable_type', 'properties'
    ];

    protected $casts = ['properties' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loggable()
    {
        return $this->morphTo();
    }

    public static function record($user, string $action, $model, string $description = '', array $properties = []): void
    {
        static::create([
            'user_id'       => $user?->id,
            'action'        => $action,
            'description'   => $description,
            'loggable_id'   => $model->id,
            'loggable_type' => get_class($model),
            'properties'    => empty($properties) ? null : $properties,
        ]);
    }
}
