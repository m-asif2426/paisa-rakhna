@extends('admin.layout')
@section('title', 'Rates Management')
@section('page-title', 'Rates Management')

@section('content')

<div class="row g-3">

    {{-- Current Live Rates --}}
    <div class="col-12 col-lg-5">
        <div class="card-panel">
            <div class="panel-head">
                <i class="bi bi-graph-up-arrow me-2 text-muted"></i>Current Active Rates
            </div>

            <div class="p-3">
                @if(isset($override))
                    <div class="alert alert-warning py-2 mb-3" style="font-size:13px;">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                        <strong>Admin Override Active</strong> — Live API rates are bypassed.
                    </div>
                @else
                    <div class="alert alert-success py-2 mb-3" style="font-size:13px;">
                        <i class="bi bi-check-circle-fill me-1"></i>
                        Source: <strong>{{ $current['source'] ?? 'auto' }}</strong>
                        @if(isset($current['updated_at']))
                            &bull; Updated: {{ \Carbon\Carbon::parse($current['updated_at'])->format('M d, Y H:i') }}
                        @endif
                    </div>
                @endif

                <table class="table table-bordered table-sm mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Metal</th>
                            <th>Rate (PKR / tola)</th>
                            <th>Nisab (tolas)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><i class="bi bi-circle-fill me-1" style="color:#f9a825;"></i>Gold</td>
                            <td><strong>PKR {{ number_format($current['gold_rate_per_tola'] ?? 0) }}</strong></td>
                            <td>{{ $current['gold_nisab_tolas'] ?? 7.5 }} tolas</td>
                        </tr>
                        <tr>
                            <td><i class="bi bi-circle-fill me-1" style="color:#90a4ae;"></i>Silver</td>
                            <td><strong>PKR {{ number_format($current['silver_rate_per_tola'] ?? 0) }}</strong></td>
                            <td>{{ $current['silver_nisab_tolas'] ?? 52.5 }} tolas</td>
                        </tr>
                    </tbody>
                </table>

                @if(isset($current['usd_to_pkr']))
                    <small class="text-muted d-block mt-2">USD → PKR: {{ $current['usd_to_pkr'] }}</small>
                @endif
            </div>
        </div>
    </div>

    {{-- Set Custom Rates --}}
    <div class="col-12 col-lg-7">
        <div class="card-panel">
            <div class="panel-head">
                <i class="bi bi-pencil-square me-2 text-muted"></i>Set Custom Rates (Override)
            </div>

            <div class="p-3">
                <p class="text-muted mb-3" style="font-size:13px;">
                    Override the live API rates with manual values. These will be used by all app users until cleared.
                </p>

                <form method="POST" action="{{ route('admin.rates.update') }}">
                    @csrf
                    <input type="hidden" name="action" value="override">

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-600" style="font-size:13px;">
                                <i class="bi bi-circle-fill me-1" style="color:#f9a825;"></i>Gold Rate (PKR per tola)
                            </label>
                            <input
                                type="number"
                                name="gold_rate_per_tola"
                                class="form-control @error('gold_rate_per_tola') is-invalid @enderror"
                                placeholder="e.g. 245000"
                                value="{{ old('gold_rate_per_tola', $override['gold_rate_per_tola'] ?? ($current['gold_rate_per_tola'] ?? '')) }}"
                                min="1"
                                required
                            >
                            @error('gold_rate_per_tola')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-md-6">
                            <label class="form-label fw-600" style="font-size:13px;">
                                <i class="bi bi-circle-fill me-1" style="color:#90a4ae;"></i>Silver Rate (PKR per tola)
                            </label>
                            <input
                                type="number"
                                name="silver_rate_per_tola"
                                class="form-control @error('silver_rate_per_tola') is-invalid @enderror"
                                placeholder="e.g. 2800"
                                value="{{ old('silver_rate_per_tola', $override['silver_rate_per_tola'] ?? ($current['silver_rate_per_tola'] ?? '')) }}"
                                min="1"
                                required
                            >
                            @error('silver_rate_per_tola')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>

                    <div class="mt-3 d-flex gap-2">
                        <button type="submit" class="btn btn-success btn-sm px-4">
                            <i class="bi bi-check-lg me-1"></i>Save Custom Rates
                        </button>
                    </div>
                </form>

                @if(isset($override))
                    <hr>
                    <form method="POST" action="{{ route('admin.rates.update') }}">
                        @csrf
                        <input type="hidden" name="action" value="clear">
                        <button type="submit" class="btn btn-outline-danger btn-sm"
                            onclick="return confirm('Clear custom rates and restore live API rates?')">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Clear Override — Use Live Rates
                        </button>
                    </form>
                @endif
            </div>
        </div>
    </div>

    {{-- Zakat Calculator Helper --}}
    <div class="col-12">
        <div class="card-panel">
            <div class="panel-head">
                <i class="bi bi-calculator me-2 text-muted"></i>Nisab Reference (Current Rates)
            </div>
            <div class="p-3">
                @php
                    $goldRate     = $current['gold_rate_per_tola'] ?? 0;
                    $silverRate   = $current['silver_rate_per_tola'] ?? 0;
                    $goldNisab    = ($current['gold_nisab_tolas'] ?? 7.5) * $goldRate;
                    $silverNisab  = ($current['silver_nisab_tolas'] ?? 52.5) * $silverRate;
                @endphp
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="stat-card" style="padding:14px;">
                            <div class="label">Gold Nisab (7.5 tolas)</div>
                            <div class="value" style="font-size:18px;">PKR {{ number_format($goldNisab) }}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card" style="padding:14px;">
                            <div class="label">Silver Nisab (52.5 tolas)</div>
                            <div class="value" style="font-size:18px;">PKR {{ number_format($silverNisab) }}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card" style="padding:14px;">
                            <div class="label">Zakat Rate</div>
                            <div class="value" style="font-size:18px;">2.5%</div>
                            <small class="text-muted" style="font-size:11px;">Fixed Islamic rate</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>

@endsection
