<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Throwable;

abstract class Controller
{
    protected function successResponse(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $this->normalizeData($data),
        ], $status);
    }

    protected function errorResponse(string $message, int $status = 400, mixed $data = null): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'data' => $this->normalizeData($data),
        ], $status);
    }

    protected function handle(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (Throwable $throwable) {
            report($throwable);

            return $this->errorResponse($throwable->getMessage(), 500);
        }
    }

    protected function paginate(LengthAwarePaginator $paginator, string $resourceClass): array
    {
        return [
            'items' => $resourceClass::collection(collect($paginator->items()))->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    protected function normalizeData(mixed $data): mixed
    {
        if ($data instanceof JsonResource) {
            return $data->resolve();
        }

        if ($data instanceof Collection) {
            return $data->values();
        }

        return $data;
    }
}
