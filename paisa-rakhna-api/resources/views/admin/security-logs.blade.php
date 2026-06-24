@extends('admin.layout')
@section('title', 'Security Logs')
@section('page-title', 'Security Logs')

@section('content')

{{-- Stats cards --}}
<div class="row g-3 mb-4">
    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Events Today</div>
                    <div class="value">{{ number_format($stats['total_today']) }}</div>
                </div>
                <div class="icon" style="background:#dbeafe; color:#1e40af;"><i class="bi bi-shield"></i></div>
            </div>
        </div>
    </div>
    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Critical Today</div>
                    <div class="value" style="color:#dc2626;">{{ number_format($stats['critical_today']) }}</div>
                </div>
                <div class="icon" style="background:#fee2e2; color:#dc2626;"><i class="bi bi-exclamation-triangle-fill"></i></div>
            </div>
        </div>
    </div>
    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Unresolved</div>
                    <div class="value" style="color:#d97706;">{{ number_format($stats['unresolved']) }}</div>
                </div>
                <div class="icon" style="background:#fef3c7; color:#d97706;"><i class="bi bi-clock-history"></i></div>
            </div>
        </div>
    </div>
    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Failed Logins Today</div>
                    <div class="value">{{ number_format($stats['failed_logins']) }}</div>
                </div>
                <div class="icon" style="background:#fce7f3; color:#be185d;"><i class="bi bi-person-x-fill"></i></div>
            </div>
        </div>
    </div>
</div>

{{-- Filters --}}
<div class="filter-bar">
    <form method="GET" action="{{ route('admin.security-logs') }}" class="d-flex flex-wrap gap-2 align-items-end">
        <div>
            <label class="form-label">Search</label>
            <input type="text" name="search" class="form-control form-control-sm" placeholder="Phone, IP, user..."
                value="{{ request('search') }}" style="min-width:180px;">
        </div>
        <div>
            <label class="form-label">Event</label>
            <select name="event" class="form-select form-select-sm" style="min-width:160px;">
                <option value="">All Events</option>
                @foreach($events as $e)
                    <option value="{{ $e }}" {{ request('event') === $e ? 'selected' : '' }}>{{ ucwords(str_replace('_', ' ', $e)) }}</option>
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
            <label class="form-label">Resolved</label>
            <select name="resolved" class="form-select form-select-sm" style="min-width:120px;">
                <option value="">All</option>
                <option value="yes" {{ request('resolved') === 'yes' ? 'selected' : '' }}>Resolved</option>
                <option value="no" {{ request('resolved') === 'no' ? 'selected' : '' }}>Unresolved</option>
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
            @if(request()->hasAny(['search','event','severity','resolved','date_from','date_to']))
                <a href="{{ route('admin.security-logs') }}" class="btn btn-outline-custom btn-sm">Clear</a>
            @endif
        </div>
    </form>
</div>

{{-- Table --}}
<div class="panel">
    <div class="panel-head">
        <span class="panel-title"><i class="bi bi-shield-exclamation"></i> Security Events</span>
        <span class="badge-status badge-muted">{{ $logs->total() }} events</span>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>User / Phone</th>
                    <th>IP Address</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr>
                    <td class="text-mono" style="white-space:nowrap;">{{ $log->created_at->format('Y-m-d H:i:s') }}</td>
                    <td>
                        <span class="text-mono" style="font-weight:600;">{{ str_replace('_', ' ', $log->event) }}</span>
                    </td>
                    <td>
                        @if($log->user)
                            <div style="font-weight:600; font-size:13px;">{{ $log->user->name }}</div>
                        @endif
                        <div class="text-mono" style="font-size:12px; color:var(--text-muted);">{{ $log->phone ?? '—' }}</div>
                    </td>
                    <td class="text-mono">{{ $log->ip_address ?? '—' }}</td>
                    <td>
                        <span class="badge-status {{ $log->severity === 'critical' ? 'badge-critical' : ($log->severity === 'warning' ? 'badge-warning' : 'badge-success') }}">
                            {{ $log->severity }}
                        </span>
                    </td>
                    <td>
                        @if($log->is_resolved)
                            <span class="badge-status badge-success"><i class="bi bi-check-circle me-1"></i>Resolved</span>
                            @if($log->resolution_note)
                                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">{{ Str::limit($log->resolution_note, 30) }}</div>
                            @endif
                        @else
                            <span class="badge-status badge-warning">Open</span>
                        @endif
                    </td>
                    <td>
                        @if(!$log->is_resolved && $log->severity !== 'info')
                        <button type="button" class="btn btn-outline-custom btn-sm" data-bs-toggle="modal" data-bs-target="#resolveModal{{ $log->id }}">
                            Resolve
                        </button>
                        <!-- Resolve Modal -->
                        <div class="modal fade" id="resolveModal{{ $log->id }}" tabindex="-1">
                            <div class="modal-dialog modal-sm">
                                <div class="modal-content" style="border-radius:var(--radius);">
                                    <form method="POST" action="{{ route('admin.security-logs.resolve', $log) }}">
                                        @csrf
                                        <div class="modal-header" style="border-bottom:1px solid var(--border);">
                                            <h6 class="modal-title" style="font-weight:700;">Resolve Event</h6>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                        </div>
                                        <div class="modal-body">
                                            <label class="form-label" style="font-size:12px; font-weight:600;">Resolution Note</label>
                                            <textarea name="note" class="form-control" rows="3" required placeholder="What was the resolution?" style="font-size:13px; border-radius:var(--radius-sm);"></textarea>
                                        </div>
                                        <div class="modal-footer" style="border-top:1px solid var(--border);">
                                            <button type="submit" class="btn btn-primary-custom btn-sm">Mark Resolved</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="bi bi-shield-check"></i>
                            <p>No security events found</p>
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
