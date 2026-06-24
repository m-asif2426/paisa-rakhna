@extends('admin.layout')
@section('title', 'Reports & Analytics')
@section('page-title', 'Reports & Analytics')

@section('head')
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
@endsection

@section('content')

{{-- Period Selector --}}
<div class="d-flex justify-content-between align-items-center mb-4">
    <div style="font-size:14px; color:var(--text-secondary);">
        Showing data for <strong style="color:var(--text-primary);">{{ $periods[$period] ?? 'Last 30 days' }}</strong>
    </div>
    <form method="GET" action="{{ route('admin.reports') }}" class="d-flex gap-2">
        @foreach($periods as $val => $label)
            <button type="submit" name="period" value="{{ $val }}"
                class="btn btn-sm {{ $period == $val ? 'btn-primary-custom' : 'btn-outline-custom' }}">
                {{ $label }}
            </button>
        @endforeach
    </form>
</div>

{{-- Summary Cards --}}
<div class="row g-3 mb-4">
    <div class="col-6 col-xl-2">
        <div class="stat-card">
            <div class="label">Total Volume</div>
            <div class="value" style="font-size:20px;">PKR {{ number_format($summary['total_volume'], 0) }}</div>
            <div class="sub">{{ number_format($summary['total_txns']) }} transactions</div>
        </div>
    </div>
    <div class="col-6 col-xl-2">
        <div class="stat-card">
            <div class="label">Avg Transaction</div>
            <div class="value" style="font-size:20px;">PKR {{ number_format($summary['avg_txn_size'], 0) }}</div>
            <div class="sub">per transaction</div>
        </div>
    </div>
    <div class="col-6 col-xl-2">
        <div class="stat-card">
            <div class="label">Total Balance</div>
            <div class="value" style="font-size:20px;">PKR {{ number_format($summary['total_wallets_balance'], 0) }}</div>
            <div class="sub">all active wallets</div>
        </div>
    </div>
    <div class="col-6 col-xl-2">
        <div class="stat-card">
            <div class="label">New Users</div>
            <div class="value">{{ number_format($summary['new_users']) }}</div>
            <div class="sub">in this period</div>
        </div>
    </div>
    <div class="col-6 col-xl-2">
        <div class="stat-card">
            <div class="label">Active Rate</div>
            <div class="value">{{ $summary['active_rate'] }}%</div>
            <div class="sub">users with transactions</div>
        </div>
    </div>
    <div class="col-6 col-xl-2">
        <div class="stat-card">
            <div class="label">Transactions</div>
            <div class="value">{{ number_format($summary['total_txns']) }}</div>
            <div class="sub">completed</div>
        </div>
    </div>
</div>

{{-- Charts Row --}}
<div class="row g-3 mb-4">
    {{-- Volume Chart --}}
    <div class="col-xl-8">
        <div class="panel">
            <div class="panel-head">
                <span class="panel-title"><i class="bi bi-graph-up"></i> Transaction Volume (Daily)</span>
            </div>
            <div class="panel-body">
                <canvas id="volumeChart" height="260"></canvas>
            </div>
        </div>
    </div>

    {{-- Type Breakdown --}}
    <div class="col-xl-4">
        <div class="panel">
            <div class="panel-head">
                <span class="panel-title"><i class="bi bi-pie-chart-fill"></i> Transaction Types</span>
            </div>
            <div class="panel-body" style="display:flex; align-items:center; justify-content:center;">
                <canvas id="typeChart" height="260"></canvas>
            </div>
        </div>
    </div>
</div>

{{-- User Growth + Top Users --}}
<div class="row g-3 mb-4">
    <div class="col-xl-7">
        <div class="panel">
            <div class="panel-head">
                <span class="panel-title"><i class="bi bi-person-plus-fill"></i> User Registrations (Daily)</span>
            </div>
            <div class="panel-body">
                <canvas id="userChart" height="200"></canvas>
            </div>
        </div>
    </div>

    <div class="col-xl-5">
        <div class="panel">
            <div class="panel-head">
                <span class="panel-title"><i class="bi bi-trophy-fill"></i> Top Users by Volume</span>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr><th>#</th><th>User</th><th>Transactions</th><th>Volume (PKR)</th></tr>
                    </thead>
                    <tbody>
                        @forelse($topUsers as $i => $tu)
                        <tr>
                            <td style="font-weight:700; color:var(--text-muted);">{{ $i + 1 }}</td>
                            <td>
                                <div style="font-weight:600;">{{ $tu->user->name ?? '—' }}</div>
                                <div class="text-mono" style="font-size:11px; color:var(--text-muted);">{{ $tu->user->phone ?? '' }}</div>
                            </td>
                            <td>{{ number_format($tu->txn_count) }}</td>
                            <td style="font-weight:700;">{{ number_format($tu->total_volume, 0) }}</td>
                        </tr>
                        @empty
                        <tr><td colspan="4" class="text-center" style="color:var(--text-muted); padding:24px;">No data</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

{{-- Type Breakdown Table --}}
<div class="panel">
    <div class="panel-head">
        <span class="panel-title"><i class="bi bi-list-ul"></i> Transaction Type Breakdown</span>
    </div>
    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr><th>Type</th><th>Count</th><th>Total Volume (PKR)</th><th>Avg Amount</th><th>Share</th></tr>
            </thead>
            <tbody>
                @php $totalVol = $typeBreakdown->sum('total') ?: 1; @endphp
                @forelse($typeBreakdown as $tb)
                <tr>
                    <td style="font-weight:600;">{{ ucwords(str_replace('_', ' ', $tb->type)) }}</td>
                    <td>{{ number_format($tb->count) }}</td>
                    <td style="font-weight:700;">{{ number_format($tb->total, 0) }}</td>
                    <td>{{ $tb->count > 0 ? number_format($tb->total / $tb->count, 0) : 0 }}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                                <div style="width:{{ round($tb->total / $totalVol * 100) }}%; height:100%; background:var(--primary); border-radius:3px;"></div>
                            </div>
                            <span style="font-size:12px; font-weight:600; min-width:36px;">{{ round($tb->total / $totalVol * 100) }}%</span>
                        </div>
                    </td>
                </tr>
                @empty
                <tr><td colspan="5" class="text-center" style="color:var(--text-muted); padding:24px;">No transaction data</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@endsection

@section('scripts')
<script>
    const green     = '#0d6f3f';
    const greenLight = '#86efac';
    const blue      = '#3b82f6';
    const red       = '#ef4444';
    const amber     = '#f59e0b';
    const purple    = '#8b5cf6';

    // Volume Chart
    new Chart(document.getElementById('volumeChart'), {
        type: 'bar',
        data: {
            labels: {!! json_encode($dailyVolume->pluck('date')) !!},
            datasets: [
                {
                    label: 'Inflow (PKR)',
                    data: {!! json_encode($dailyVolume->pluck('inflow')) !!},
                    backgroundColor: green + '90',
                    borderRadius: 4,
                },
                {
                    label: 'Outflow (PKR)',
                    data: {!! json_encode($dailyVolume->pluck('outflow')) !!},
                    backgroundColor: red + '60',
                    borderRadius: 4,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { font: { size: 11, weight: 600 }, usePointStyle: true } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: v => 'PKR ' + (v/1000) + 'k' } },
            }
        }
    });

    // Type Pie Chart
    const typeLabels = {!! json_encode($typeBreakdown->pluck('type')->map(fn($t) => ucwords(str_replace('_', ' ', $t)))) !!};
    const typeData   = {!! json_encode($typeBreakdown->pluck('total')) !!};
    const typeColors = [green, blue, amber, red, purple, '#06b6d4', '#ec4899', '#84cc16'];

    new Chart(document.getElementById('typeChart'), {
        type: 'doughnut',
        data: {
            labels: typeLabels,
            datasets: [{ data: typeData, backgroundColor: typeColors.slice(0, typeLabels.length), borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, usePointStyle: true } } },
            cutout: '65%',
        }
    });

    // User Growth Chart
    new Chart(document.getElementById('userChart'), {
        type: 'line',
        data: {
            labels: {!! json_encode($userGrowth->pluck('date')) !!},
            datasets: [{
                label: 'New Users',
                data: {!! json_encode($userGrowth->pluck('count')) !!},
                borderColor: blue,
                backgroundColor: blue + '15',
                fill: true,
                tension: .3,
                pointRadius: 3,
                pointBackgroundColor: blue,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, stepSize: 1 }, beginAtZero: true },
            }
        }
    });
</script>
@endsection
