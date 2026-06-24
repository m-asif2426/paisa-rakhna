@extends('admin.layout')
@section('title', 'Notifications')
@section('page-title', 'Notifications')

@section('content')

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <span style="font-size:14px; color:var(--text-secondary);">
            <strong style="color:var(--text-primary);">{{ $unreadCount }}</strong> unread notification{{ $unreadCount !== 1 ? 's' : '' }}
        </span>
    </div>
    <div class="d-flex gap-2">
        @if($unreadCount > 0)
            <form method="POST" action="{{ route('admin.notifications.read-all') }}">
                @csrf
                <button type="submit" class="btn btn-outline-custom btn-sm">
                    <i class="bi bi-check2-all me-1"></i> Mark All Read
                </button>
            </form>
        @endif
    </div>
</div>

{{-- Filters --}}
<div class="filter-bar">
    <form method="GET" action="{{ route('admin.notifications') }}" class="d-flex flex-wrap gap-2 align-items-end">
        <div>
            <label class="form-label">Type</label>
            <select name="type" class="form-select form-select-sm" style="min-width:160px;">
                <option value="">All Types</option>
                @foreach($types as $t)
                    <option value="{{ $t }}" {{ request('type') === $t ? 'selected' : '' }}>{{ ucwords(str_replace('_', ' ', $t)) }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="form-label">Severity</label>
            <select name="severity" class="form-select form-select-sm" style="min-width:120px;">
                <option value="">All</option>
                <option value="info" {{ request('severity') === 'info' ? 'selected' : '' }}>Info</option>
                <option value="warning" {{ request('severity') === 'warning' ? 'selected' : '' }}>Warning</option>
                <option value="critical" {{ request('severity') === 'critical' ? 'selected' : '' }}>Critical</option>
            </select>
        </div>
        <div>
            <label class="form-label">Status</label>
            <select name="read" class="form-select form-select-sm" style="min-width:120px;">
                <option value="">All</option>
                <option value="no" {{ request('read') === 'no' ? 'selected' : '' }}>Unread</option>
                <option value="yes" {{ request('read') === 'yes' ? 'selected' : '' }}>Read</option>
            </select>
        </div>
        <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary-custom btn-sm"><i class="bi bi-funnel-fill me-1"></i>Filter</button>
            @if(request()->hasAny(['type','severity','read']))
                <a href="{{ route('admin.notifications') }}" class="btn btn-outline-custom btn-sm">Clear</a>
            @endif
        </div>
    </form>
</div>

{{-- Notification list --}}
<div class="panel">
    <div class="panel-head">
        <span class="panel-title"><i class="bi bi-bell-fill"></i> All Notifications</span>
        <span class="badge-status badge-muted">{{ $notifications->total() }} total</span>
    </div>

    @forelse($notifications as $notif)
    <div style="padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; gap:14px; align-items:flex-start; {{ !$notif->is_read ? 'background:#f0fdf4;' : '' }}">
        {{-- Icon --}}
        <div style="flex-shrink:0; width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center;
            @php
                $iconBg = match($notif->severity) {
                    'critical' => 'background:#fee2e2; color:#dc2626;',
                    'warning'  => 'background:#fef3c7; color:#d97706;',
                    default    => 'background:#dbeafe; color:#2563eb;',
                };
                $icon = match($notif->type) {
                    'kyc_submitted'      => 'bi-person-badge',
                    'large_transaction'  => 'bi-exclamation-diamond',
                    'security_alert'     => 'bi-shield-exclamation',
                    'user_registered'    => 'bi-person-plus',
                    'system_alert'       => 'bi-gear',
                    default              => 'bi-bell',
                };
            @endphp
            {{ $iconBg }}">
            <i class="bi {{ $icon }}" style="font-size:16px;"></i>
        </div>

        {{-- Content --}}
        <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
                <span style="font-weight:700; font-size:13.5px; color:var(--text-primary);">{{ $notif->title }}</span>
                @if(!$notif->is_read)
                    <span style="width:7px; height:7px; border-radius:50%; background:var(--primary); display:inline-block;"></span>
                @endif
            </div>
            <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:4px;">{{ $notif->message }}</div>
            <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:10px;">
                <span class="badge-status {{ $notif->severity === 'critical' ? 'badge-danger' : ($notif->severity === 'warning' ? 'badge-warning' : 'badge-info') }}" style="font-size:10px;">
                    {{ $notif->severity }}
                </span>
                <span>{{ ucwords(str_replace('_', ' ', $notif->type)) }}</span>
                <span>{{ $notif->created_at->diffForHumans() }}</span>
            </div>
        </div>

        {{-- Actions --}}
        @if(!$notif->is_read)
        <form method="POST" action="{{ route('admin.notifications.read', $notif) }}" style="flex-shrink:0;">
            @csrf
            <button type="submit" class="btn btn-outline-custom btn-sm" title="Mark as read">
                <i class="bi bi-check2"></i>
            </button>
        </form>
        @else
        <span style="font-size:11px; color:var(--text-muted);"><i class="bi bi-check2-circle"></i></span>
        @endif
    </div>
    @empty
    <div class="empty-state">
        <i class="bi bi-bell-slash"></i>
        <p>No notifications</p>
    </div>
    @endforelse

    @if($notifications->hasPages())
    <div class="px-3 py-3">{{ $notifications->links() }}</div>
    @endif
</div>

@endsection
