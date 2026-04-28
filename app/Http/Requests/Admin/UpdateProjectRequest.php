<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'client_id' => ['sometimes', 'exists:users,id'],
            'project_type_id' => ['nullable', 'exists:project_types,id'],
            'status' => ['sometimes', Rule::in([ 'pending', 'in_progress', 'completed', 'on_hold'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'progress' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ];
    }
}
