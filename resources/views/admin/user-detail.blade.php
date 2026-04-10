@extends('admin.layout')
@section('title', 'User — ' . $user->name)
@section('page-title', 'User Detail')

@section('content')

{{-- Back button --}}
<div class="mb-3">
    <a href="{{ route('admin.users') }}" class="btn btn-sm btn-outline-secondary" style="border-radius:8px;">
        <i class="bi bi-arrow-left me-1"></i> Back to Users
    </a>
</div>

<div class="row g-3">

    {{-- ── LEFT COLUMN ── --}}
    <div class="col-lg-4">

        {{-- Profile Card --}}
        <div class="card-panel mb-3">
            <div class="panel-head"><i class="bi bi-person-circle me-2 text-muted"></i>Profile</div>
            <div class="p-4 text-center">
                <div style="width:72px; height:72px; border-radius:50%; background:#e8f5e9; color:#00C853;
                    display:flex; align-items:center; justify-content:center; margin:0 auto 12px;
                    font-size:28px; font-weight:900;">
                    {{ strtoupper(substr($user->name, 0, 1)) }}
                </div>
                <div style="font-size:18px; font-weight:800; color:#1a1a2e;">{{ $user->name }}</div>
                <div style="font-size:13px; color:#6c757d; margin-top:4px;">{{ $user->phone ?? '—' }}</div>
                <div style="font-size:12px; color:#6c757d;">{{ $user->email ?? 'No email' }}</div>

                <div class="mt-3 d-flex justify-content-center gap-2">
                    <span class="badge {{ $user->is_active ? 'bg-success' : 'bg-danger' }}" style="font-size:12px; padding:5px 12px; border-radius:20px;">
                        {{ $user->is_active ? 'Active' : 'Inactive' }}
                    </span>
                    @php $kyc = $user->kyc_status ?? 'pending'; @endphp
                    <span class="badge {{ $kyc === 'verified' ? 'bg-success' : ($kyc === 'rejected' ? 'bg-danger' : 'bg-warning text-dark') }}"
                        style="font-size:12px; padding:5px 12px; border-radius:20px; text-transform:capitalize;">
                        KYC: {{ $kyc }}
                    </span>
                </div>
            </div>
            <div class="p-3 border-top" style="font-size:13px;">
                <div class="d-flex justify-content-between py-1">
                    <span class="text-muted">User ID</span><span class="fw-600">#{{ $user->id }}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                    <span class="text-muted">Joined</span>
                    <span>{{ $user->created_at->format('d M Y') }}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                    <span class="text-muted">M-PIN Set</span>
                    <span>{{ $user->mpin?->is_set ? '✅ Yes' : '❌ No' }}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                    <span class="text-muted">Login Fails</span>
                    <span>{{ $user->failed_login_attempts ?? 0 }}</span>
                </div>
            </div>
        </div>

        {{-- Wallet Card --}}
        <div class="card-panel mb-3">
            <div class="panel-head"><i class="bi bi-wallet2 me-2 text-muted"></i>Wallet</div>
            @if($user->wallet)
            <div class="p-4">
                <div style="font-size:28px; font-weight:900; color:#00C853;">
                    PKR {{ number_format($user->wallet->balance, 2) }}
                </div>
                <div style="font-size:12px; color:#6c757d; margin-top:4px;">
                    Account: <code>{{ $user->wallet->account_number }}</code>
                </div>
                <div style="font-size:12px; color:#6c757d;">
                    Status: <strong style="text-transform:capitalize;">{{ $user->wallet->status }}</strong>
                </div>
            </div>

            {{-- Wallet Adjustment --}}
            <div class="p-3 border-top">
                <div style="font-size:12px; font-weight:700; color:#6c757d; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px;">
                    Admin Balance Adjustment
                </div>
                <form method="POST" action="{{ route('admin.users.wallet-adjust', $user) }}"
                    onsubmit="return confirm('Are you sure you want to adjust this user\'s balance?')">
                    @csrf
                    <div class="mb-2">
                        <select name="action" class="form-select form-select-sm" style="border-radius:8px;" required>
                            <option value="">Select Action</option>
                            <option value="add">➕ Add Balance</option>
                            <option value="deduct">➖ Deduct Balance</option>
                        </select>
                    </div>
                    <div class="mb-2">
                        <input type="number" name="amount" class="form-control form-control-sm"
                            placeholder="Amount (PKR)" min="1" max="1000000" step="0.01"
                            style="border-radius:8px;" required>
                    </div>
                    <div class="mb-2">
                        <input type="text" name="note" class="form-control form-control-sm"
                            placeholder="Reason / Note" maxlength="255"
                            style="border-radius:8px;" required>
                    </div>
                    <button type="submit" class="btn btn-sm btn-warning w-100" style="border-radius:8px; font-weight:600;">
                        <i class="bi bi-pencil-square me-1"></i> Apply Adjustment
                    </button>
                </form>
            </div>
            @else
            <div class="p-4 text-muted text-center">No wallet found.</div>
            @endif
        </div>

        {{-- KYC Documents --}}
        @if($kyc)
        <div class="card-panel mb-3">
            <div class="panel-head"><i class="bi bi-patch-check me-2 text-muted"></i>KYC Documents</div>
            <div class="p-3">
                <div style="font-size:13px; margin-bottom:12px;">
                    <span class="text-muted">CNIC:</span>
                    <strong style="font-family:monospace;">{{ $kyc->cnic ?? '—' }}</strong>
                </div>
                <div class="row g-2">
                    @foreach(['front' => 'CNIC Front', 'back' => 'CNIC Back', 'selfie' => 'Selfie'] as $type => $label)
                    <div class="col-12">
                        <div style="font-size:11px; font-weight:700; color:#6c757d; margin-bottom:4px;">{{ $label }}</div>
                        @php
                            $hasImg = match($type) {
                                'front'  => !empty($kyc->cnic_front_path),
                                'back'   => !empty($kyc->cnic_back_path),
                                'selfie' => !empty($kyc->selfie_path),
                                default  => false,
                            };
                        @endphp
                        @if($hasImg)
                        <a href="{{ route('admin.kyc.image', [$kyc->id, $type]) }}" target="_blank">
                            <img src="{{ route('admin.kyc.image', [$kyc->id, $type]) }}"
                                alt="{{ $label }}"
                                style="width:100%; border-radius:8px; border:1px solid #e8ecf0; cursor:pointer; max-height:140px; object-fit:cover;"
                                onerror="this.parentElement.innerHTML='<span style=\'color:#dc3545;font-size:12px;\'>Image load failed</span>'">
                        </a>
                        @else
                        <div style="background:#f8f9fa; border-radius:8px; height:80px; display:flex; align-items:center; justify-content:center; color:#adb5bd; font-size:12px;">
                            Not uploaded
                        </div>
                        @endif
                    </div>
                    @endforeach
                </div>

                @if($kyc->rejection_reason)
                <div class="mt-2 p-2" style="background:#fff5f5; border-radius:8px; font-size:12px; color:#c53030;">
                    <strong>Rejection reason:</strong> {{ $kyc->rejection_reason }}
                </div>
                @endif
            </div>
        </div>
        @endif

        {{-- Toggle Active Status --}}
        <div class="card-panel">
            <div class="panel-head"><i class="bi bi-shield-lock me-2 text-muted"></i>Account Control</div>
            <div class="p-3">
                <form method="POST" action="{{ route('admin.users.toggle', $user) }}"
                    onsubmit="return confirm('Toggle status for {{ addslashes($user->name) }}?')">
                    @csrf
                    <button type="submit"
                        class="btn btn-sm w-100 {{ $user->is_active ? 'btn-outline-danger' : 'btn-outline-success' }}"
                        style="border-radius:8px;">
                        {{ $user->is_active ? '🔴 Deactivate Account' : '🟢 Activate Account' }}
                    </button>
                </form>
            </div>
        </div>

    </div>

    {{-- ── RIGHT COLUMN — Transactions ── --}}
    <div class="col-lg-8">
        <div class="card-panel">
            <div class="panel-head d-flex align-items-center justify-content-between">
                <span><i class="bi bi-arrow-left-right me-2 text-muted"></i>Transaction History</span>
                <span class="badge bg-secondary" style="font-size:12px;">{{ $transactions->total() }} total</span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Reference</th>
                            <th>Type</th>
                            <th>Amount</th>
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
                                <span class="badge bg-light text-dark text-capitalize" style="font-size:11px; border-radius:20px; padding:3px 8px;">
                                    {{ str_replace('_', ' ', $txn->type) }}
                                </span>
                            </td>
                            <td style="font-weight:700; font-size:13px;
                                color:{{ in_array($txn->type, ['receive', 'add_money']) ? '#00C853' : '#1a1a2e' }}">
                                {{ in_array($txn->type, ['receive', 'add_money']) ? '+' : '-' }}
                                PKR {{ number_format($txn->amount, 2) }}
                            </td>
                            <td style="font-size:12px;">{{ $txn->recipient_name ?? $txn->recipient_phone ?? '—' }}</td>
                            <td>
                                <span class="badge badge-{{ $txn->status }} text-capitalize"
                                    style="font-size:11px; padding:3px 8px; border-radius:20px;">
                                    {{ $txn->status }}
                                </span>
                            </td>
                            <td style="font-size:11px; color:#6c757d; white-space:nowrap;">
                                {{ $txn->created_at->format('d M Y') }}<br>
                                {{ $txn->created_at->format('H:i') }}
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="6" class="text-center text-muted py-5">No transactions yet.</td>
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
    </div>

</div>

@endsection
