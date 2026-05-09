<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tasks MODIFY status ENUM('todo', 'in_progress', 'ready_for_review', 'done', 'on_hold') DEFAULT 'todo'");
            DB::statement("ALTER TABLE projects MODIFY status ENUM('todo', 'in_progress', 'ready_for_review', 'done', 'on_hold') DEFAULT 'todo'");
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedInteger('estimated_days')->nullable()->after('progress');
            $table->string('risk_level')->nullable()->after('estimated_days');
            $table->text('ai_comment')->nullable()->after('risk_level');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['estimated_days', 'risk_level', 'ai_comment']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE projects MODIFY status ENUM('todo', 'in_progress', 'ready_for_review', 'done', 'on_hold') DEFAULT 'todo'");
            DB::statement("ALTER TABLE tasks MODIFY status ENUM('todo', 'in_progress', 'ready_for_review', 'done', 'on_hold') DEFAULT 'todo'");
        }
    }
};
