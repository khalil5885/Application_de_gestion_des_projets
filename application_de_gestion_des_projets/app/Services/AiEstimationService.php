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

        $taskCount = $project->tasks->count();
        $highPriorityCount = $project->tasks->where('priority', 'high')->count();
        $mediumPriorityCount = $project->tasks->where('priority', 'medium')->count();
        $overdueCount = $project->tasks->filter(fn($t) => 
            $t->due_date && $t->due_date->isPast() && $t->status !== 'done'
        )->count();
        
        // Simple heuristic
        $baseDays = max(1, $taskCount * 2);
        $extraDays = $highPriorityCount * 3;
        $totalDays = $baseDays + $extraDays;

        $riskLevel = 'low';
        if ($overdueCount > 2 || ($highPriorityCount / max($taskCount, 1)) > 0.5) {
            $riskLevel = 'high';
        } elseif ($overdueCount > 0 || ($highPriorityCount / max($taskCount, 1)) > 0.3) {
            $riskLevel = 'medium';
        }

        $comments = [
            'low' => 'Project scope is well-defined with manageable workload. Timeline appears realistic based on current task distribution.',
            'medium' => 'Moderate complexity detected due to high-priority task concentration. Recommend close monitoring and daily standups.',
            'high' => 'Critical risk identified: multiple overdue tasks and/or excessive high-priority items. Immediate replanning required.',
        ];

        return [
            'estimated_days' => $totalDays,
            'risk_level' => $riskLevel,
            'ai_comment' => $comments[$riskLevel] . ' (Based on ' . $taskCount . ' tasks: ' . $highPriorityCount . ' high, ' . $mediumPriorityCount . ' medium priority)',
        ];
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
