@extends('admin.layout')
@section('title', 'KYC Requests')
@section('page-title', 'KYC Requests')

@section('content')

{{-- Filter bar --}}
<div class="card-panel mb-4">
    <div class="panel-head"><i class="bi bi-funnel me-2 text-muted"></i>Filter</div>
    <div class="p-3">
        <form method="GET" action="{{ route('admin.kyc') }}" class="d-flex gap-2 flex-wrap">
            <select name="status" class="form-select form-select-sm" style="max-width:180px; border-radius:8px;">
                <option value="">All Statuses</option>
                @foreach($statuses as $st)
                <option value="{{ $st }}" {{ request('status') === $st ? 'selected' : '' }}>
                    {{ ucfirst(str_replace('_', ' ', $st)) }}
                </option>
                @endforeach
            </select>
            <button type="submit" class="btn btn-sm btn-success px-3" style="border-radius:8px;">Filter</button>
            @if(request('status'))
            <a href="{{ route('admin.kyc') }}" class="btn btn-sm btn-outline-secondary" style="border-radius:8px;">Clear</a>
            @endif
        </form>
    </div>
</div>

{{-- KYC Table --}}
<div class="card-panel">
    <div class="panel-head d-flex align-items-center justify-content-between">
        <span><i class="bi bi-patch-check me-2 text-muted"></i>KYC Submissions</span>
        <span class="badge bg-secondary" style="font-size:12px;">{{ $documents->total() }} total</span>
    </div>
    <div class="table-responsive">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>CNIC</th>
                    <th>Documents</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse($documents as $doc)
                <tr>
                    <td style="color:#6c757d; font-size:12px;">{{ $doc->id }}</td>
                    <td>
                        <div style="font-weight:600; font-size:13px;">
                            <a href="{{ route('admin.users.show', $doc->user) }}" style="color:#1a1a2e; text-decoration:none;">
                                {{ $doc->user->name ?? '—' }}
                                <i class="bi bi-arrow-up-right" style="font-size:10px; color:#adb5bd;"></i>
                            </a>
                        </div>
                        <small style="color:#6c757d;">{{ $doc->user->phone ?? '' }}</small>
                    </td>
                    <td style="font-family:monospace; font-size:12px;">{{ $doc->cnic ?? '—' }}</td>
                    <td>
                        <div class="d-flex gap-1 flex-wrap">
                            @foreach(['front' => 'Front', 'back' => 'Back', 'selfie' => 'Selfie'] as $type => $label)
                            @php
                                $hasImg = match($type) {
                                    'front'  => !empty($doc->cnic_front_path),
                                    'back'   => !empty($doc->cnic_back_path),
                                    'selfie' => !empty($doc->selfie_path),
                                    default  => false,
                                };
                            @endphp
                            @if($hasImg)
                            <a href="{{ route('admin.kyc.image', [$doc->id, $type]) }}" target="_blank"
                               class="badge bg-success text-decoration-none"
                               style="font-size:10px; border-radius:20px; padding:3px 7px; cursor:pointer;"
                               title="View {{ $label }}">
                                {{ $label }} <i class="bi bi-eye-fill"></i>
                            </a>
                            @else
                            <span class="badge bg-secondary" style="font-size:10px; border-radius:20px; padding:3px 7px;">
                                {{ $label }} ✗
                            </span>
                            @endif
                            @endforeach
                        </div>
                    </td>
                    <td>
                        @php
                            $cls = match($doc->status) {
                                'verified'     => 'bg-success',
                                'rejected'     => 'bg-danger',
                                'under_review' => 'bg-primary',
                                default        => 'bg-warning text-dark',
                            };
                        @endphp
                        <span class="badge {{ $cls }}" style="font-size:11px; border-radius:20px; padding:3px 10px; text-transform:capitalize;">
                            {{ str_replace('_', ' ', $doc->status) }}
                        </span>
                        @if($doc->rejection_reason)
                        <div style="font-size:11px; color:#c53030; margin-top:3px;">{{ Str::limit($doc->rejection_reason, 40) }}</div>
                        @endif
                    </td>
                    <td style="font-size:12px; color:#6c757d;">{{ $doc->created_at->format('d M Y') }}</td>
                    <td>
                        @if($doc->status !== 'verified')
                        <form method="POST" action="{{ route('admin.kyc.approve', $doc) }}" class="d-inline">
                            @csrf
                            <button type="submit" class="btn btn-sm btn-success px-2 py-1" style="font-size:12px; border-radius:6px;"
                                onclick="return confirm('Approve KYC for {{ addslashes($doc->user->name ?? '') }}?')">
                                <i class="bi bi-check-lg"></i> Approve
                            </button>
                        </form>
                        @endif
                        @if($doc->status !== 'rejected')
                        <button type="button" class="btn btn-sm btn-outline-danger px-2 py-1" style="font-size:12px; border-radius:6px;"
                            data-bs-toggle="modal" data-bs-target="#rejectModal{{ $doc->id }}">
                            <i class="bi bi-x-lg"></i> Reject
                        </button>

                        {{-- Reject Modal --}}
                        <div class="modal fade" id="rejectModal{{ $doc->id }}" tabindex="-1">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content" style="border-radius:16px; border:none; box-shadow:0 8px 40px rgba(0,0,0,.12);">
                                    <div class="modal-header border-0 pb-0">
                                        <h5 class="modal-title fw-bold">Reject KYC</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <form method="POST" action="{{ route('admin.kyc.reject', $doc) }}">
                                        @csrf
                                        <div class="modal-body pt-2">
                                            <p style="font-size:13px; color:#6c757d;">
                                                Rejecting KYC for <strong>{{ $doc->user->name ?? '—' }}</strong>. Please provide a reason.
                                            </p>
                                            <textarea name="reason" class="form-control" rows="3" placeholder="Reason for rejection..." required
                                                style="border-radius:10px; font-size:13px;"></textarea>
                                        </div>
                                        <div class="modal-footer border-0 pt-0">
                                            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                            <button type="submit" class="btn btn-sm btn-danger px-3" style="border-radius:8px;">Reject KYC</button>
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
                    <td colspan="7" class="text-center text-muted py-5">No KYC submissions found.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    @if($documents->hasPages())
    <div class="d-flex justify-content-center py-3">
        {{ $documents->links() }}
    </div>
    @endif
</div>

@endsection
