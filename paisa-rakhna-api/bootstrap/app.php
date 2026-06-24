<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Allow all origins for local development (mobile app + Insomnia)
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        // Register admin middleware alias
        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
        // Never redirect to login — always return JSON 401 for API
        $middleware->redirectGuestsTo(fn (\Illuminate\Http\Request $request) => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON 401 for unauthenticated API requests (instead of redirecting to /login)
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Token required.',
                ], 401);
            }
        });
    })->create();
