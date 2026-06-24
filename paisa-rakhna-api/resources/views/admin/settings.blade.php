@extends('admin.layout')
@section('title', 'System Settings')
@section('page-title', 'System Settings')

@section('content')

<form method="POST" action="{{ route('admin.settings.update') }}">
    @csrf

    @foreach($groups as $group => $settings)
    <div class="panel mb-4">
        <div class="panel-head">
            <span class="panel-title">
                @php
                    $groupIcons = [
                        'general' => 'bi-gear', 'security' => 'bi-shield-lock', 'limits' => 'bi-speedometer',
                        'notifications' => 'bi-bell', 'maintenance' => 'bi-tools',
                    ];
                @endphp
                <i class="bi {{ $groupIcons[$group] ?? 'bi-sliders' }}"></i>
                {{ ucfirst(str_replace('_', ' ', $group)) }}
            </span>
            <span class="badge-status badge-muted">{{ $settings->count() }} settings</span>
        </div>
        <div class="panel-body">
            <div class="row g-3">
                @foreach($settings as $setting)
                <div class="col-md-6">
                    <div style="padding:14px 16px; border:1px solid var(--border); border-radius:var(--radius-sm); background:#fafafa;">
                        <label class="form-label mb-1" style="font-size:12.5px; font-weight:700; color:var(--text-primary);">
                            {{ $setting->label }}
                        </label>
                        @if($setting->description)
                            <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">{{ $setting->description }}</div>
                        @endif

                        @if($setting->type === 'boolean')
                            <div class="form-check form-switch">
                                <input type="hidden" name="settings[{{ $setting->key }}]" value="0">
                                <input class="form-check-input" type="checkbox" name="settings[{{ $setting->key }}]" value="1"
                                    {{ filter_var($setting->value, FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' }}
                                    style="cursor:pointer;">
                                <label class="form-check-label" style="font-size:12.5px; color:var(--text-secondary);">
                                    {{ filter_var($setting->value, FILTER_VALIDATE_BOOLEAN) ? 'Enabled' : 'Disabled' }}
                                </label>
                            </div>
                        @elseif($setting->type === 'integer')
                            <input type="number" name="settings[{{ $setting->key }}]" value="{{ $setting->value }}"
                                class="form-control form-control-sm" style="max-width:200px; border-radius:var(--radius-sm); font-size:13px;">
                        @else
                            @if($setting->is_sensitive)
                                <input type="password" name="settings[{{ $setting->key }}]" value="{{ $setting->value }}"
                                    class="form-control form-control-sm" style="border-radius:var(--radius-sm); font-size:13px;">
                            @else
                                <input type="text" name="settings[{{ $setting->key }}]" value="{{ $setting->value }}"
                                    class="form-control form-control-sm" style="border-radius:var(--radius-sm); font-size:13px;">
                            @endif
                        @endif
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
    @endforeach

    <div class="d-flex justify-content-end mb-4">
        <button type="submit" class="btn btn-primary-custom">
            <i class="bi bi-check-lg me-1"></i> Save All Settings
        </button>
    </div>
</form>

@endsection
