<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AssignProjectEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;    
    }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'exists:users,id'],
            'role' => ['nullable', 'string', 'max:100'],
        ];
    }
}
