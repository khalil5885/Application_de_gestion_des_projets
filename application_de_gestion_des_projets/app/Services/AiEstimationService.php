<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiEstimationService
{
    public function estimate(Project $project): array
    {
        $project->loadMissing('tasks');

        $apiKey = config('services.openai.key');
        if (!$apiKey) {
            throw new RuntimeException('OpenAI API key is not configured.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->asJson()
            ->post(rtrim(config('services.openai.base_url'), '/') . '/responses', [
                'model' => config('services.openai.model'),
                'instructions' => 'You estimate project delivery timelines for a project management SaaS. Return only the requested JSON shape.',
                'input' => $this->buildPrompt($project),
                'text' => [
                    'format' => [
                        'type' => 'json_schema',
                        'name' => 'project_estimation',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'additionalProperties' => false,
                            'properties' => [
                                'estimated_days' => ['type' => 'integer', 'minimum' => 1],
                                'risk_level' => ['type' => 'string', 'enum' => ['low', 'medium', 'high']],
                                'ai_comment' => ['type' => 'string'],
                            ],
                            'required' => ['estimated_days', 'risk_level', 'ai_comment'],
                        ],
                    ],
                ],
            ])
            ->throw()
            ->json();

        return $this->normalizeEstimate($this->extractOutputText($response));
    }

    protected function buildPrompt(Project $project): string
    {
        $taskSummaries = $project->tasks
            ->map(fn ($task) => [
                'title' => $task->title,
                'priority' => $task->priority,
                'status' => $task->status,
            ])
            ->values()
            ->all();

        return json_encode([
            'project' => [
                'name' => $project->name,
                'description' => $project->description,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
            ],
            'task_count' => $project->tasks->count(),
            'task_types' => $project->tasks->pluck('priority')->filter()->unique()->values()->all(),
            'tasks' => $taskSummaries,
        ], JSON_THROW_ON_ERROR);
    }

    protected function extractOutputText(array $response): string
    {
        if (!empty($response['output_text'])) {
            return $response['output_text'];
        }

        foreach ($response['output'] ?? [] as $output) {
            foreach ($output['content'] ?? [] as $content) {
                if (($content['type'] ?? null) === 'output_text' && isset($content['text'])) {
                    return $content['text'];
                }
            }
        }

        throw new RuntimeException('OpenAI response did not include output text.');
    }

    protected function normalizeEstimate(string $outputText): array
    {
        $estimate = json_decode($outputText, true, flags: JSON_THROW_ON_ERROR);

        if (
            !isset($estimate['estimated_days'], $estimate['risk_level'], $estimate['ai_comment'])
            || !in_array($estimate['risk_level'], ['low', 'medium', 'high'], true)
        ) {
            throw new RuntimeException('OpenAI response did not match the expected estimate schema.');
        }

        return [
            'estimated_days' => (int) $estimate['estimated_days'],
            'risk_level' => $estimate['risk_level'],
            'ai_comment' => $estimate['ai_comment'],
        ];
    }
}
