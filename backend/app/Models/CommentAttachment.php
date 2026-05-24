<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CommentAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'comment_id',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
    ];

    protected $appends = ['url', 'name'];

    public function getUrlAttribute(): string
    {
        if (!$this->file_path) {
            return '';
        }

        try {
            return Storage::disk('public')->url($this->file_path);
        } catch (\Exception $e) {
            return '';
        }
    }

    public function getNameAttribute(): string
    {
        return $this->file_name ?? '';
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
}