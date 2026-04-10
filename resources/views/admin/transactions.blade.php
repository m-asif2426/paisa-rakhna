@extends('admin.layout')
@section('title', 'Transactions')
@section('page-title', 'Transactions')

@section('content')

{{-- Filters --}}
<div class="card-panel mb-4">
    <div class="panel-head">
        <i class="bi bi-funnel me-2 text-muted"></i>Filter Transactions
    </div>
    <div class="p-3">
        <form method="GET" action="{{ route('admin.transactions') }}" class="d-flex flex-wrap gap-2 align-items-end">
            <div>
                <label class="form-label" style="font-size:12px; font-weight:600;">Search</label>
                <input type="text" name="search" class="form-control form-control-sm"
                    placeholder="Ref / user / phone..." value="{{ request('search') }}"
                    style="border-radius:8px; min-width:200px;">
            </div>
            <div>
                <label class="form-label" style="font-size:12px; font-weight:600;">Type</label>
                <select name="type" class="form-select form-select-sm" style="border-radius:8px; min-width:160px;">
                    <option value="">All Types</option>
                    @foreach($types as $t)
                        <option value="{{ $t }}" {{ request('type') === $t ? 'selected' : '' }}>
                            {{ ucwords(str_replace('_', ' ', $t)) }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label" style="font-size:12px; font-weight:600;">Status</label>
                <select name="status" class="form-select form-select-sm" style="border-radius:8px; min-width:130px;">
                    <option value="">All Statuses</option>
                    @foreach($statuses as $s)
                        <option value="{{ $s }}" {{ request('status') === $s ? 'selected' : '' }}>
                            {{ ucfirst($s) }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label" style="font-size:12px; font-weight:600;">From Date</label>
                <input type="date" name="date_from" class="form-control form-control-sm"
                    value="{{ request('date_from') }}" style="border-radius:8px;">
            </div>
            <div>
                <label class="form-label" style="font-size:12px; font-weight:600;">To Date</label>
                <input type="date" name="date_to" class="form-control form-control-sm"
                    value="{{ request('date_to') }}" style="border-radius:8px;">
            </div>
            <div class="d-flex gap-2 align-items-end">
                <button type="submit" class="btn btn-sm btn-success" style="border-radius:8px;">
                    <i class="bi bi-funnel-fill me-1"></i> Apply
                </button>
                @if(request()->hasAny(['type', 'status', 'search', 'date_from', 'date_to']))
                    <a href="{{ route('admin.transactions') }}" class="btn btn-sm btn-outline-secondary" style="border-radius:8px;">
                        Clear
                    </a>
                @endif
                <a href="{{ route('admin.transactions.export', request()->only(['type', 'status', 'date_from', 'date_to'])) }}"
                   class="btn btn-sm btn-outline-success" style="border-radius:8px;">
                    <i class="bi bi-download me-1"></i> Export CSV
                </a>
            </div>
        </form>
    </div>
</div>

{{-- Transactions table --}}
<div class="card-panel">
    <div class="panel-head d-flex align-items-center justify-content-between">
        <span><i class="bi bi-arrow-left-right me-2 text-muted"></i>All Transactions</span>
        <span class="badge bg-secondary" style="font-size:12px;">
            {{ $transactions->total() }} total
        </span>
    </div>
    <div class="table-responsive">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>Reference</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount (PKR)</th>
                    <th>Fee</th>
                    <th>Recipient</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @forelse($transactions as $txn)
                <tr>
                    <td><code style="font-size:11px;">{{ $txn->reference }}</code></td>
                    <td>
                        <div style="font-weight:600; font-size:13px;">{{ $txn->user?->name ?? '—' }}</div>
                        <div style="font-size:11px; color:#6c757d;">{{ $txn->user?->phone ?? '' }}</div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark text-capitalize" style="font-size:11px; border-radius:20px; padding:3px 8px;">
                            {{ str_replace('_', ' ', $txn->type) }}
                        </span>
                    </td>
                    <td style="font-weight:700; font-size:13px;">
                        {{ number_format($txn->amount, 2) }}
                    </td>
                    <td style="font-size:12px; color:#6c757d;">
                        {{ $txn->fee > 0 ? number_format($txn->fee, 2) : '—' }}
                    </td>
                    <td style="font-size:12px;">
                        {{ $txn->recipient_name ?? $txn->recipient_phone ?? '—' }}
                    </td>
                    <td>
                        <span class="badge badge-{{ $txn->status }} text-capitalize"
                            style="font-size:11px; padding:4px 8px; border-radius:20px;">
                            {{ $txn->status }}
                        </span>
                    </td>
                    <td style="font-size:12px; color:#6c757d; white-space:nowrap;">
                        {{ $txn->created_at->format('M d, Y') }}<br>
                        <span style="font-size:10px;">{{ $txn->created_at->format('H:i') }}</span>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">No transactions found.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($transactions->hasPages())
    <div class="p-3 d-flex justify-content-end">
        {{ $transactions->links('pagination::bootstrap-5') }}
    </div>
    @endif
</div>

@endsection
