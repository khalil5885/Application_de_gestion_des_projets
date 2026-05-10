<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'client_id' => ['required', 'exists:users,id'],
            'project_type_id' => ['nullable', 'exists:project_types,id'],
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'ready_for_review', 'completed', 'on_hold'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'progress' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'estimated_days' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'risk_level' => ['sometimes', 'nullable', Rule::in(['low', 'medium', 'high'])],
            'ai_comment' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
