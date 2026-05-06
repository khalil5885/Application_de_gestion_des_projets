<?php

namespace App\Http\Requests\Employee;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requestable_type' => ['required', Rule::in(['task', 'project'])],
            'requestable_id' => ['required', 'integer'],
            'payload' => ['required', 'array'],
            'payload.requested_deadline' => ['required', 'date'],
            'payload.reason' => ['required', 'string', 'max:2000'],
        ];
    }

    public function requestableClass(): string
    {
        return $this->validated('requestable_type') === 'project'
            ? Project::class
            : Task::class;
    }
}
