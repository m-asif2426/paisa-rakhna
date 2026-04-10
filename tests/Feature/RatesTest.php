<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RatesTest extends TestCase
{
    public function test_zakat_rates_endpoint_is_publicly_accessible(): void
    {
        $this->getJson('/api/rates/zakat')->assertOk();
    }

    public function test_zakat_rates_returns_expected_structure(): void
    {
        $this->getJson('/api/rates/zakat')
             ->assertOk()
             ->assertJsonPath('success', true)
             ->assertJsonStructure(['rates' => [
                 'gold_rate_per_tola',
                 'silver_rate_per_tola',
                 'gold_nisab_tolas',
                 'silver_nisab_tolas',
                 'source',
                 'updated_at',
             ]]);
    }

    public function test_zakat_rates_returns_positive_values(): void
    {
        $response = $this->getJson('/api/rates/zakat');

        $rates = $response->json('rates');
        $this->assertGreaterThan(0, $rates['gold_rate_per_tola']);
        $this->assertGreaterThan(0, $rates['silver_rate_per_tola']);
    }

    public function test_zakat_rates_uses_cache(): void
    {
        Cache::flush(); // start clean

        // First call — populates cache
        $this->getJson('/api/rates/zakat')->assertOk();

        // Verify the cache key is now set
        $this->assertTrue(Cache::has('zakat_rates'));
    }

    public function test_zakat_rates_falls_back_to_static_when_external_api_fails(): void
    {
        Cache::flush();

        // Fake all HTTP calls to fail
        Http::fake(['*' => Http::response(null, 500)]);

        $response = $this->getJson('/api/rates/zakat')->assertOk();

        $this->assertEquals('static', $response->json('rates.source'));
    }

    public function test_nisab_thresholds_are_correct(): void
    {
        $response = $this->getJson('/api/rates/zakat')->assertOk();

        $rates = $response->json('rates');
        $this->assertEquals(7.5,  $rates['gold_nisab_tolas']);
        $this->assertEquals(52.5, $rates['silver_nisab_tolas']);
    }
}
