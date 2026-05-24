<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RestoreAuthorizationHeader
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->hasHeader('Authorization') && $request->hasHeader('X-Auth-Token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->header('X-Auth-Token'));
        }
        return $next($request);
    }
}
