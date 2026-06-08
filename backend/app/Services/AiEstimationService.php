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
    $promptData = $this->buildPromptData($project);

    // Comment out the try/catch temporarily to see the real error
    // try {
        $aiResult = $this->aiEstimate($project, $promptData);
        return array_merge($aiResult, [
            'data_sent_to_ai' => $promptData,
            'source' => 'Groq AI'
        ]);
    // } catch (RuntimeException $e) {
    //     return array_merge($this->localEstimate($project), [
    //         'data_sent_to_ai' => $promptData,
    //         'source' => 'Local Fallback Formula (AI Failed)'
    //     ]);
    // }
}

    protected function aiEstimate(Project $project, array $promptData): array
    {
        $response = Http::withoutVerifying()
            ->timeout(30)
            ->withToken(config('services.groq.key'))
            ->withHeaders(['Content-Type' => 'application/json']) // Crucial fix
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a project estimation expert. Provide unique, organic project analysis. Respond ONLY with valid JSON matching exactly this schema: {"estimated_days": int, "risk_level": "low" or "medium" or "high", "ai_comment": string}. No markdown, no explanation, no static formulas.',
                    ],
                    [
                        'role' => 'user',
                        'content' => 'Here is the project data: ' . json_encode($promptData),
                    ],
                ],
                'temperature' => 0.7, // Increased from 0.2 to make answers dynamic and varied
                'response_format' => ['type' => 'json_object'],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Groq API request failed: ' . $response->body());
        }

        $outputText = $response->json('choices.0.message.content');

        if (!$outputText) {
            throw new RuntimeException('Groq response did not include output text.');
        }

        return $this->normalizeEstimate($outputText);
    }

    protected function localEstimate(Project $project): array
    {
        $taskCount   = $project->tasks->count();
        $highCount   = $project->tasks->where('priority', 'high')->count();
        $mediumCount = $project->tasks->where('priority', 'medium')->count();
        $overdueCount = $project->tasks->filter(
            fn($t) => $t->due_date && $t->due_date->isPast() && $t->status !== 'done'
        )->count();

        $totalDays = max(1, ($taskCount * 2) + ($highCount * 3));

        $riskLevel = 'low';
        if ($overdueCount > 2 || ($taskCount > 0 && ($highCount / $taskCount) > 0.5)) {
            $riskLevel = 'high';
        } elseif ($overdueCount > 0 || ($taskCount > 0 && ($highCount / $taskCount) > 0.3)) {
            $riskLevel = 'medium';
        }

        $comments = [
            'low'    => 'Project scope is manageable. Timeline looks realistic based on current tasks.',
            'medium' => 'Moderate complexity detected. Recommend close monitoring.',
            'high'   => 'High risk: overdue tasks or too many high-priority items. Replanning advised.',
        ];

        return [
            'estimated_days' => $totalDays,
            'risk_level'     => $riskLevel,
            'ai_comment'     => $comments[$riskLevel] . ' (Fallback calculation — ' . $taskCount . ' tasks)',
        ];
    }

    protected function buildPromptData(Project $project): array
    {
        $taskSummaries = $project->tasks
            ->map(fn ($task) => [
                'title'    => $task->title,
                'priority' => $task->priority,
                'status'   => $task->status,
            ])
            ->values()
            ->all();

        return [
            'project' => [
                'name'        => $project->name,
                'description' => $project->description,
                'start_date'  => $project->start_date?->toDateString(),
                'end_date'    => $project->end_date?->toDateString(),
            ],
            'task_count' => $project->tasks->count(),
            'task_types' => $project->tasks->pluck('priority')->filter()->unique()->values()->all(),
            'tasks'      => $taskSummaries,
        ];
    }

    protected function normalizeEstimate(string $outputText): array
    {
        $estimate = json_decode($outputText, true, flags: JSON_THROW_ON_ERROR);

        if (
            !isset($estimate['estimated_days'], $estimate['risk_level'], $estimate['ai_comment'])
            || !in_array($estimate['risk_level'], ['low', 'medium', 'high'], true)
        ) {
            throw new RuntimeException('AI response did not match the expected estimate schema.');
        }

        return [
            'estimated_days' => (int) $estimate['estimated_days'],
            'risk_level'     => $estimate['risk_level'],
            'ai_comment'     => $estimate['ai_comment'],
        ];
    }
}