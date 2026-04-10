@extends('admin.layout')
@section('title', 'Dashboard')
@section('page-title', 'Dashboard')

@section('content')

{{-- Stats Row --}}
<div class="row g-3 mb-4">

    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Total Users</div>
                    <div class="value">{{ number_format($stats['total_users']) }}</div>
                    <small class="text-muted" style="font-size:11px;">
                        +{{ $stats['new_users_month'] }} this month
                    </small>
                </div>
                <div class="icon" style="background:#e8f5e9; color:#00C853;">
                    <i class="bi bi-people-fill"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Active Users</div>
                    <div class="value">{{ number_format($stats['active_users']) }}</div>
                    <small class="text-muted" style="font-size:11px;">
                        {{ $stats['total_users'] > 0 ? round($stats['active_users'] / $stats['total_users'] * 100) : 0 }}% of total
                    </small>
                </div>
                <div class="icon" style="background:#e8f5e9; color:#00C853;">
                    <i class="bi bi-person-check-fill"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Transactions</div>
                    <div class="value">{{ number_format($stats['total_transactions']) }}</div>
                    <small class="text-muted" style="font-size:11px;">
                        {{ $stats['pending_txns'] }} pending
                    </small>
                </div>
                <div class="icon" style="background:#e3f2fd; color:#1976d2;">
                    <i class="bi bi-arrow-left-right"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Total Volume</div>
                    <div class="value" style="font-size:20px;">
                        PKR {{ number_format($stats['total_volume'], 0) }}
                    </div>
                    <small class="text-muted" style="font-size:11px;">
                        {{ $stats['completed_txns'] }} completed txns
                    </small>
                </div>
                <div class="icon" style="background:#fff8e1; color:#f9a825;">
                    <i class="bi bi-wallet2"></i>
                </div>
            </div>
        </div>
    </div>

    <div class="col-6 col-xl-3">
        <div class="stat-card">
            <div class="d-flex align-items-start justify-content-between">
                <div>
                    <div class="label">Total Balance (All Wallets)</div>
                    <div class="value" style="font-size:20px;">
                        PKR {{ number_format($stats['total_balance'], 0) }}
                    </div>
                    <small class="text-muted" style="font-size:11px;">Across all active wallets</small>
                </div>
                <div class="icon" style="background:#fce4ec; color:#c62828;">
                    <i class="bi bi-bank"></i>
                </div>
            </div>
        </div>
    </div>

</div>

{{-- Recent Transactions --}}
<div class="card-panel">
    <div class="panel-head d-flex align-items-center justify-content-between">
        <span><i class="bi bi-clock-history me-2 text-muted"></i>Recent Transactions</span>
        <a href="{{ route('admin.transactions') }}" class="btn btn-sm btn-outline-secondary" style="font-size:12px;">
            View All
        </a>
    </div>
    <div class="table-responsive">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>Reference</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @forelse($recent as $txn)
                <tr>
                    <td><code style="font-size:11px;">{{ $txn->reference }}</code></td>
                    <td>{{ $txn->user?->name ?? '—' }}</td>
                    <td>
                        <span class="badge bg-light text-dark text-capitalize" style="font-size:11px;">
                            {{ str_replace('_', ' ', $txn->type) }}
                        </span>
                    </td>
                    <td class="fw-600">PKR {{ number_format($txn->amount, 2) }}</td>
                    <td>
                        <span class="badge badge-{{ $txn->status }} text-capitalize" style="font-size:11px; padding:4px 8px; border-radius:20px;">
                            {{ $txn->status }}
                        </span>
                    </td>
                    <td style="font-size:12px; color:#6c757d;">{{ $txn->created_at->format('M d, Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">No transactions yet.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@endsection
