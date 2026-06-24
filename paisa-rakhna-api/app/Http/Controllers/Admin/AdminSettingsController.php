<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditService;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function index()
    {
        $groups = SystemSetting::orderBy('group')->orderBy('id')->get()->groupBy('group');

        return view('admin.settings', compact('groups'));
    }

    public function update(Request $request)
    {
        $settings = $request->input('settings', []);

        foreach ($settings as $key => $value) {
            $setting = SystemSetting::where('key', $key)->first();
            if (!$setting) continue;

            $oldValue = $setting->value;

            // Boolean fields come as checkbox — absent means false
            if ($setting->type === 'boolean') {
                $value = $value ? 'true' : 'false';
            }

            if ($oldValue !== $value) {
                $setting->update(['value' => $value]);

                AuditService::log(
                    'settings.update',
                    "Changed setting \"{$setting->label}\" from \"{$oldValue}\" to \"{$value}\"",
                    'system_setting',
                    $setting->id,
                    ['value' => $oldValue],
                    ['value' => $value],
                );
            }
        }

        return back()->with('success', 'Settings updated successfully.');
    }
}
