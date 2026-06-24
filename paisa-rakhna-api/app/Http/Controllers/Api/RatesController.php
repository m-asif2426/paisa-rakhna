<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class RatesController extends Controller
{
    /**
     * GET /rates/zakat
     * Returns gold & silver rates for Zakat calculation.
     * Tries metals-api.com first, falls back to static PKR estimates.
     * Cached for 1 hour to avoid hitting API limits.
     */
    public function zakat()
    {
        // Admin override takes highest priority
        $override = Cache::get('admin_rates_override');
        if ($override) {
            return response()->json([
                'success' => true,
                'rates'   => $override,
            ]);
        }

        $data = Cache::remember('zakat_rates', 3600, function () {
            return $this->fetchLiveRates();
        });

        return response()->json([
            'success' => true,
            'rates'   => $data,
        ]);
    }

    private function fetchLiveRates(): array
    {
        // --- Attempt 1: open.er-api.com for USD→PKR, then gold.org public prices ---
        try {
            // Gold price in USD per troy oz (public, no key needed)
            $goldRes = Http::timeout(5)->get('https://api.gold-api.com/price/XAU');
            $silverRes = Http::timeout(5)->get('https://api.gold-api.com/price/XAG');
            // USD to PKR
            $fxRes = Http::timeout(5)->get('https://open.er-api.com/v6/latest/USD');

            if ($goldRes->successful() && $silverRes->successful() && $fxRes->successful()) {
                $usdToPkr       = (float) ($fxRes->json('rates.PKR') ?? 278);
                $goldUsdPerOz   = (float) ($goldRes->json('price') ?? 0);
                $silverUsdPerOz = (float) ($silverRes->json('price') ?? 0);

                // 1 troy oz = 2.667 tolas  (1 tola = 11.664g, 1 troy oz = 31.1g)
                $tolaFactor = 31.1035 / 11.664;

                $goldPkrPerTola   = round($goldUsdPerOz   * $usdToPkr / $tolaFactor);
                $silverPkrPerTola = round($silverUsdPerOz * $usdToPkr / $tolaFactor);

                if ($goldPkrPerTola > 0 && $silverPkrPerTola > 0) {
                    return [
                        'gold_rate_per_tola'   => $goldPkrPerTola,
                        'silver_rate_per_tola' => $silverPkrPerTola,
                        'gold_nisab_tolas'     => 7.5,
                        'silver_nisab_tolas'   => 52.5,
                        'usd_to_pkr'           => $usdToPkr,
                        'source'               => 'live',
                        'updated_at'           => now()->toIso8601String(),
                    ];
                }
            }
        } catch (\Throwable) {
            // Fall through to static fallback
        }

        // --- Fallback: static approximate PKR rates (April 2026) ---
        return [
            'gold_rate_per_tola'   => 245000,
            'silver_rate_per_tola' => 2800,
            'gold_nisab_tolas'     => 7.5,
            'silver_nisab_tolas'   => 52.5,
            'usd_to_pkr'           => 278,
            'source'               => 'static',
            'updated_at'           => now()->toIso8601String(),
        ];
    }
}
