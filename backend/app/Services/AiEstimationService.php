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

        try {
            return $this->aiEstimate($project);
        } catch (RuntimeException $e) {
            return $this->localEstimate($project);
        }
    }

    protected function aiEstimate(Project $project): array
    {
        $prompt = $this->buildPrompt($project);

        $response = Http::timeout(30)
            ->withToken(config('services.groq.key'))
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a project estimation expert. Respond ONLY with valid JSON matching exactly this schema: {"estimated_days": int, "risk_level": "low" or "medium" or "high", "ai_comment": string}. No markdown, no code fences, no explanation, no extra fields.',
                    ],
                    [
                        'role' => 'user',
                        'content' => 'Here is the project data: ' . $prompt,
                    ],
                ],
                'temperature' => 0.2,
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
            'ai_comment'     => $comments[$riskLevel] . ' (local estimate — ' . $taskCount . ' tasks: ' . $highCount . ' high, ' . $mediumCount . ' medium priority)',
        ];
    }

    protected function buildPrompt(Project $project): string
    {
        $taskSummaries = $project->tasks
            ->map(fn ($task) => [
                'title'    => $task->title,
                'priority' => $task->priority,
                'status'   => $task->status,
            ])
            ->values()
            ->all();

        return json_encode([
            'project' => [
                'name'        => $project->name,
                'description' => $project->description,
                'start_date'  => $project->start_date?->toDateString(),
                'end_date'    => $project->end_date?->toDateString(),
            ],
            'task_count' => $project->tasks->count(),
            'task_types' => $project->tasks->pluck('priority')->filter()->unique()->values()->all(),
            'tasks'      => $taskSummaries,
        ], JSON_THROW_ON_ERROR);
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