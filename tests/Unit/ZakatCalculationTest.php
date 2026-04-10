<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Pure unit test for Zakat calculation logic.
 * No database or framework required — pure math.
 */
class ZakatCalculationTest extends TestCase
{
    // ── Nisab thresholds ────────────────────────────────────────────────────
    private const GOLD_RATE_PER_TOLA   = 245000;  // PKR
    private const SILVER_RATE_PER_TOLA = 2800;    // PKR
    private const GOLD_NISAB_TOLAS     = 7.5;
    private const SILVER_NISAB_TOLAS   = 52.5;
    private const ZAKAT_RATE           = 0.025;   // 2.5%

    /** Replicates the zakat calculation logic used in ZakatScreen.tsx */
    private function calculateZakat(array $input): array
    {
        $goldValue        = ($input['goldTolas']   ?? 0) * self::GOLD_RATE_PER_TOLA;
        $silverValue      = ($input['silverTolas'] ?? 0) * self::SILVER_RATE_PER_TOLA;
        $cash             = $input['cash']         ?? 0;
        $bankBalance      = $input['bankBalance']  ?? 0;
        $businessGoods    = $input['businessGoods'] ?? 0;
        $receivables      = $input['receivables']  ?? 0;

        $totalAssets = $goldValue + $silverValue + $cash + $bankBalance + $businessGoods + $receivables;
        $nisabValue  = self::SILVER_NISAB_TOLAS * self::SILVER_RATE_PER_TOLA; // silver-based (conservative)

        $zakatDue    = $totalAssets >= $nisabValue ? $totalAssets * self::ZAKAT_RATE : 0;
        $eligible    = $totalAssets >= $nisabValue;

        return compact('totalAssets', 'nisabValue', 'zakatDue', 'eligible');
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    public function test_silver_nisab_value_is_correct(): void
    {
        $result = $this->calculateZakat([]);

        // 52.5 tolas × 2800 PKR = 147,000 PKR
        $this->assertEquals(147000, $result['nisabValue']);
    }

    public function test_zakat_due_is_zero_below_nisab(): void
    {
        // All zeros
        $result = $this->calculateZakat([
            'cash' => 50000, // below 147,000 nisab
        ]);

        $this->assertFalse($result['eligible']);
        $this->assertEquals(0.0, $result['zakatDue']);
    }

    public function test_zakat_is_2_5_percent_of_total_assets_above_nisab(): void
    {
        $result = $this->calculateZakat([
            'cash'        => 100000,
            'bankBalance' => 200000,
        ]);

        // Total = 300,000  |  Nisab = 147,000  → eligible
        $this->assertTrue($result['eligible']);
        $this->assertEquals(300000 * 0.025, $result['zakatDue']);
    }

    public function test_gold_value_calculation(): void
    {
        $result = $this->calculateZakat([
            'goldTolas' => 10, // 10 × 245,000 = 2,450,000
        ]);

        $this->assertEquals(2450000, $result['totalAssets']);
        $this->assertTrue($result['eligible']);
        $this->assertEquals(61250.0, $result['zakatDue']); // 2.5% of 2,450,000
    }

    public function test_silver_value_calculation(): void
    {
        $result = $this->calculateZakat([
            'silverTolas' => 100, // 100 × 2,800 = 280,000
        ]);

        $this->assertEquals(280000, $result['totalAssets']);
        $this->assertTrue($result['eligible']);
        $this->assertEquals(7000.0, $result['zakatDue']); // 2.5% of 280,000
    }

    public function test_all_asset_types_are_summed(): void
    {
        $result = $this->calculateZakat([
            'goldTolas'    => 1,    // 245,000
            'silverTolas'  => 10,   // 28,000
            'cash'         => 50000,
            'bankBalance'  => 50000,
            'businessGoods'=> 20000,
            'receivables'  => 5000,
        ]);

        $expected = 245000 + 28000 + 50000 + 50000 + 20000 + 5000; // 398,000
        $this->assertEquals($expected, $result['totalAssets']);
        $this->assertEquals(round($expected * 0.025, 2), round($result['zakatDue'], 2));
    }

    public function test_exactly_at_nisab_threshold_is_eligible(): void
    {
        $nisabValue = self::SILVER_NISAB_TOLAS * self::SILVER_RATE_PER_TOLA; // 147,000

        $result = $this->calculateZakat(['cash' => $nisabValue]);

        $this->assertTrue($result['eligible']);
        $this->assertEquals($nisabValue * self::ZAKAT_RATE, $result['zakatDue']);
    }

    public function test_one_rupee_below_nisab_is_not_eligible(): void
    {
        $nisabValue = self::SILVER_NISAB_TOLAS * self::SILVER_RATE_PER_TOLA; // 147,000

        $result = $this->calculateZakat(['cash' => $nisabValue - 1]);

        $this->assertFalse($result['eligible']);
        $this->assertEquals(0.0, $result['zakatDue']);
    }

    public function test_zero_assets_produces_zero_zakat(): void
    {
        $result = $this->calculateZakat([]);

        $this->assertEquals(0, $result['totalAssets']);
        $this->assertEquals(0.0, $result['zakatDue']);
        $this->assertFalse($result['eligible']);
    }
}
