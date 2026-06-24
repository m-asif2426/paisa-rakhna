@extends('admin.layout')
@section('title', 'Users')
@section('page-title', 'Users')

@section('content')

{{-- Search bar --}}
<div class="card-panel mb-4">
    <div class="panel-head">
        <i class="bi bi-search me-2 text-muted"></i>Search & Filter
    </div>
    <div class="p-3">
        <form method="GET" action="{{ route('admin.users') }}" class="d-flex flex-wrap gap-2 align-items-end">
            <input
                type="text"
                name="search"
                class="form-control"
                placeholder="Search by name, phone, or email..."
                value="{{ request('search') }}"
                style="max-width:300px; border-radius:8px; font-size:13px;"
            >
            <select name="kyc_status" class="form-select form-select-sm" style="max-width:160px; border-radius:8px;">
                <option value="">All KYC</option>
                <option value="pending"  {{ request('kyc_status') === 'pending'  ? 'selected' : '' }}>Pending</option>
                <option value="verified" {{ request('kyc_status') === 'verified' ? 'selected' : '' }}>Verified</option>
                <option value="rejected" {{ request('kyc_status') === 'rejected' ? 'selected' : '' }}>Rejected</option>
            </select>
            <button type="submit" class="btn btn-sm btn-success px-3" style="border-radius:8px;">
                <i class="bi bi-search"></i> Search
            </button>
            @if(request()->hasAny(['search', 'kyc_status']))
                <a href="{{ route('admin.users') }}" class="btn btn-sm btn-outline-secondary" style="border-radius:8px;">
                    Clear
                </a>
            @endif
            <a href="{{ route('admin.users.export', request()->only(['kyc_status'])) }}"
               class="btn btn-sm btn-outline-success ms-auto" style="border-radius:8px;">
                <i class="bi bi-download me-1"></i> Export CSV
            </a>
        </form>
    </div>
</div>

{{-- Users table --}}
<div class="card-panel">
    <div class="panel-head d-flex align-items-center justify-content-between">
        <span><i class="bi bi-people me-2 text-muted"></i>All Users</span>
        <span class="badge bg-secondary" style="font-size:12px;">
            {{ $users->total() }} total
        </span>
    </div>
    <div class="table-responsive">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>KYC</th>
                    <th>Balance</th>
                    <th>Transactions</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                @forelse($users as $user)
                <tr>
                    <td style="color:#6c757d; font-size:12px;">{{ $user->id }}</td>
                    <td>
                        <a href="{{ route('admin.users.show', $user) }}" style="font-weight:600; font-size:13px; color:#1a1a2e; text-decoration:none;">
                            {{ $user->name }}
                            <i class="bi bi-arrow-up-right" style="font-size:10px; color:#adb5bd;"></i>
                        </a>
                    </td>
                    <td style="font-size:13px;">{{ $user->phone ?? '—' }}</td>
                    <td style="font-size:12px; color:#6c757d;">{{ $user->email ?? '—' }}</td>
                    <td>
                        @php $kyc = $user->kyc_status ?? 'pending'; @endphp
                        <span class="badge
                            {{ $kyc === 'verified' ? 'bg-success' : ($kyc === 'rejected' ? 'bg-danger' : 'bg-warning text-dark') }}"
                            style="font-size:11px; text-transform:capitalize; border-radius:20px; padding:3px 8px;">
                            {{ $kyc }}
                        </span>
                    </td>
                    <td style="font-size:13px; font-weight:600;">
                        @if($user->wallet)
                            PKR {{ number_format($user->wallet->balance, 2) }}
                        @else
                            <span class="text-muted">—</span>
                        @endif
                    </td>
                    <td style="font-size:13px;">{{ $user->transactions_count }}</td>
                    <td>
                        <span class="badge badge-{{ $user->is_active ? 'active' : 'inactive' }}"
                            style="font-size:11px; padding:4px 8px; border-radius:20px;">
                            {{ $user->is_active ? 'Active' : 'Inactive' }}
                        </span>
                    </td>
                    <td style="font-size:12px; color:#6c757d;">{{ $user->created_at->format('M d, Y') }}</td>
                    <td>
                        <form method="POST" action="{{ route('admin.users.toggle', $user) }}"
                              onsubmit="return confirm('Toggle status for {{ addslashes($user->name) }}?');">
                            @csrf
                            <button type="submit"
                                class="btn btn-sm {{ $user->is_active ? 'btn-outline-danger' : 'btn-outline-success' }}"
                                style="font-size:11px; border-radius:8px; padding:3px 10px;">
                                {{ $user->is_active ? 'Deactivate' : 'Activate' }}
                            </button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">No users found.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($users->hasPages())
    <div class="p-3 d-flex justify-content-end">
        {{ $users->links('pagination::bootstrap-5') }}
    </div>
    @endif
</div>

@endsection
