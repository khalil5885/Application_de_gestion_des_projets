<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    public function taskTemplates(): HasMany
    {
        return $this->hasMany(TaskTemplate::class)->orderBy('order');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
