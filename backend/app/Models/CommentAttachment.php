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

    // Accessor to get full URL
    public function getUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    // Relation back to comment
    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }
}