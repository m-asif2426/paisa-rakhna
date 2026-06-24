@extends('admin.layout')
@section('title', 'Audit Logs')
@section('page-title', 'Audit Logs')

@section('content')

<div class="filter-bar">
    <form method="GET" action="{{ route('admin.audit-logs') }}" class="d-flex flex-wrap gap-2 align-items-end">
        <div>
            <label class="form-label">Search</label>
            <input type="text" name="search" class="form-control form-control-sm" placeholder="Actor, description, IP..."
                value="{{ request('search') }}" style="min-width:200px;">
        </div>
        <div>
            <label class="form-label">Action</label>
            <select name="action" class="form-select form-select-sm" style="min-width:160px;">
                <option value="">All Actions</option>
                @foreach($actions as $a)
                    <option value="{{ $a }}" {{ request('action') === $a ? 'selected' : '' }}>{{ $a }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="form-label">Severity</label>
            <select name="severity" class="form-select form-select-sm" style="min-width:120px;">
                <option value="">All</option>
                @foreach($severities as $s)
                    <option value="{{ $s }}" {{ request('severity') === $s ? 'selected' : '' }}>{{ ucfirst($s) }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="form-label">Role</label>
            <select name="role" class="form-select form-select-sm" style="min-width:120px;">
                <option value="">All Roles</option>
                <option value="admin" {{ request('role') === 'admin' ? 'selected' : '' }}>Admin</option>
                <option value="user" {{ request('role') === 'user' ? 'selected' : '' }}>User</option>
                <option value="system" {{ request('role') === 'system' ? 'selected' : '' }}>System</option>
            </select>
        </div>
        <div>
            <label class="form-label">From</label>
            <input type="date" name="date_from" class="form-control form-control-sm" value="{{ request('date_from') }}">
        </div>
        <div>
            <label class="form-label">To</label>
            <input type="date" name="date_to" class="form-control form-control-sm" value="{{ request('date_to') }}">
        </div>
        <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary-custom btn-sm"><i class="bi bi-funnel-fill me-1"></i>Filter</button>
            @if(request()->hasAny(['search','action','severity','role','date_from','date_to']))
                <a href="{{ route('admin.audit-logs') }}" class="btn btn-outline-custom btn-sm">Clear</a>
            @endif
        </div>
    </form>
</div>

<div class="panel">
    <div class="panel-head">
        <span class="panel-title"><i class="bi bi-journal-text"></i> Audit Trail</span>
        <span class="badge-status badge-muted">{{ $logs->total() }} entries</span>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Entity</th>
                    <th>IP Address</th>
                    <th>Severity</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr>
                    <td class="text-mono" style="white-space:nowrap;">{{ $log->created_at->format('Y-m-d H:i:s') }}</td>
                    <td>
                        <div style="font-weight:600; font-size:13px;">{{ $log->actor_name ?? '—' }}</div>
                        <div style="font-size:11px;" class="badge-status {{ $log->actor_role === 'admin' ? 'badge-info' : ($log->actor_role === 'system' ? 'badge-muted' : 'badge-success') }}">
                            {{ $log->actor_role }}
                        </div>
                    </td>
                    <td class="text-mono">{{ $log->action }}</td>
                    <td style="max-width:300px; font-size:12.5px; color:var(--text-secondary);">
                        {{ Str::limit($log->description, 80) }}
                    </td>
                    <td>
                        @if($log->entity_type)
                            <span class="text-mono">{{ $log->entity_type }}#{{ $log->entity_id }}</span>
                        @else
                            <span style="color:var(--text-muted);">—</span>
                        @endif
                    </td>
                    <td class="text-mono">{{ $log->ip_address ?? '—' }}</td>
                    <td>
                        <span class="badge-status {{ $log->severity === 'critical' ? 'badge-danger' : ($log->severity === 'warning' ? 'badge-warning' : 'badge-success') }}">
                            {{ $log->severity }}
                        </span>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="bi bi-journal-text"></i>
                            <p>No audit logs found</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    @if($logs->hasPages())
    <div class="px-3 pb-3">{{ $logs->links() }}</div>
    @endif
</div>

@endsection
