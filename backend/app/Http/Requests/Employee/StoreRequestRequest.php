<?php

namespace App\Http\Requests\Employee;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requestable_id' => ['required', 'integer'],
            'requestable_type' => ['required', 'string', 'in:task,project'],
            'type' => ['required', 'string', 'in:extension,task_review,project_review'],
            'payload' => ['required', 'array'],
            'payload.notes' => ['nullable', 'string', 'max:1000'],
            'payload.requested_deadline' => ['required_if:type,extension', 'date', 'after:today'],
        ];
    }

    public function requestableClass(): string
    {
        return match ($this->input('requestable_type')) {
            'task' => Task::class,
            'project' => Project::class,
            default => abort(422, 'Invalid requestable type.'),
        };
    }

    
}