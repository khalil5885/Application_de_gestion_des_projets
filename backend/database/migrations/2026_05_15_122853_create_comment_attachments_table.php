<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('comment_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->onDelete('cascade');
            $table->string('file_path');           // storage path (e.g., comments/123/filename.pdf)
            $table->string('file_name');           // original file name
            $table->string('mime_type');           // e.g., image/jpeg, application/pdf
            $table->unsignedBigInteger('file_size'); // bytes
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('comment_attachments');
    }
};