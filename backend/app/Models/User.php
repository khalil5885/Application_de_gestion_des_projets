<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;

    protected string $guard_name = 'sanctum';

    protected $fillable = [
    'name', 'email', 'password', 'global_role', 'phone', 'avatar', 'is_active',
    'setup_token', 'setup_token_expires_at', // ← add these
];

    protected $hidden = [
        'password',
        'remember_token',
        'setup_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'setup_token_expires_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    public function memberProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')
            ->withPivot('id', 'role')
            ->withTimestamps();
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(Request::class);
    }

    public function handledRequests(): HasMany
    {
        return $this->hasMany(Request::class, 'handled_by');
    }
}
