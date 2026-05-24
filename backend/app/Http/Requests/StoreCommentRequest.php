<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // FIX: content is nullable — file-only posts are valid
            'content'       => ['nullable', 'string'],
            'attachments'    => ['nullable', 'array', 'max:10'],
            'attachments.*'  => ['file', 'max:10240', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx,txt,zip,rar'],
            'visibility'     => ['nullable', 'in:public,internal,private'],
        ];
    }

    /**
     * Custom validation: require at least content OR one attachment.
     * Runs after the field rules pass.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $hasContent     = !empty(trim($this->input('content', '')));
            $hasAttachments = $this->hasFile('attachments');

            if (!$hasContent && !$hasAttachments) {
                $v->errors()->add('content', 'A comment must include text or at least one attachment.');
            }
        });
    }
}