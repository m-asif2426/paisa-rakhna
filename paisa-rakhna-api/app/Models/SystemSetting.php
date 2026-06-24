<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'key', 'value', 'type', 'group', 'label', 'description', 'is_sensitive',
    ];

    protected $casts = [
        'is_sensitive' => 'boolean',
    ];

    /**
     * Get a setting value by key with optional default.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) return $default;

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->value,
            'json'    => json_decode($setting->value, true),
            default   => $setting->value,
        };
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, mixed $value): void
    {
        $setting = static::where('key', $key)->first();
        if ($setting) {
            $setting->update(['value' => is_array($value) ? json_encode($value) : (string) $value]);
        }
    }
}
