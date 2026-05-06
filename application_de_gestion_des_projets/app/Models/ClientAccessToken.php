<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientAccessToken extends Model
{
    protected $fillable = ['client_id', 'project_id', 'token', 'expires_at'];

    protected $casts = ['expires_at' => 'datetime'];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}