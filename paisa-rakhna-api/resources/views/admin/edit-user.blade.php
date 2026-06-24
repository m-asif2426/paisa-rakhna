@extends('admin.layout')
@section('title', 'Edit — ' . $user->name)
@section('page-title', 'Edit User')

@section('content')

<div class="mb-3">
    <a href="{{ route('admin.users.show', $user) }}" class="btn btn-sm btn-outline-secondary" style="border-radius:8px;">
        <i class="bi bi-arrow-left me-1"></i> Back to User
    </a>
</div>

<div class="row justify-content-center">
    <div class="col-lg-7">
        <div class="card-panel">
            <div class="panel-head">
                <i class="bi bi-pencil-square me-2 text-muted"></i>Edit User — {{ $user->name }}
            </div>
            <div class="p-4">

                @if(session('success'))
                <div class="alert alert-success alert-dismissible fade show mb-3" role="alert" style="border-radius:10px; font-size:13px;">
                    <i class="bi bi-check-circle me-2"></i>{{ session('success') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                @endif

                @if($errors->any())
                <div class="alert alert-danger mb-3" role="alert" style="border-radius:10px; font-size:13px;">
                    <ul class="mb-0">
                        @foreach($errors->all() as $err)
                        <li>{{ $err }}</li>
                        @endforeach
                    </ul>
                </div>
                @endif

                <form method="POST" action="{{ route('admin.users.update', $user) }}">
                    @csrf
                    @method('PUT')

                    {{-- Full Name --}}
                    <div class="mb-3">
                        <label class="form-label fw-600" style="font-size:13px;">Full Name <span class="text-danger">*</span></label>
                        <input
                            type="text"
                            name="name"
                            class="form-control @error('name') is-invalid @enderror"
                            value="{{ old('name', $user->name) }}"
                            placeholder="Full Name"
                            required
                            style="border-radius:10px;"
                        >
                        @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    {{-- Phone --}}
                    <div class="mb-3">
                        <label class="form-label fw-600" style="font-size:13px;">Phone Number <span class="text-danger">*</span></label>
                        <input
                            type="text"
                            name="phone"
                            class="form-control @error('phone') is-invalid @enderror"
                            value="{{ old('phone', $user->phone) }}"
                            placeholder="03xxxxxxxxx"
                            required
                            style="border-radius:10px;"
                        >
                        @error('phone') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    {{-- Email --}}
                    <div class="mb-3">
                        <label class="form-label fw-600" style="font-size:13px;">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            class="form-control @error('email') is-invalid @enderror"
                            value="{{ old('email', $user->email) }}"
                            placeholder="user@example.com (optional)"
                            style="border-radius:10px;"
                        >
                        @error('email') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>

                    {{-- KYC Status --}}
                    <div class="mb-3">
                        <label class="form-label fw-600" style="font-size:13px;">KYC Status <span class="text-danger">*</span></label>
                        <select name="kyc_status" class="form-select @error('kyc_status') is-invalid @enderror" style="border-radius:10px;" required>
                            @foreach(['pending' => 'Pending', 'under_review' => 'Under Review', 'verified' => 'Verified', 'rejected' => 'Rejected'] as $val => $label)
                            <option value="{{ $val }}" {{ old('kyc_status', $user->kyc_status) === $val ? 'selected' : '' }}>
                                {{ $label }}
                            </option>
                            @endforeach
                        </select>
                        @error('kyc_status') <div class="invalid-feedback">{{ $message }}</div> @enderror
                        <div class="form-text" style="font-size:11px;">Changing KYC to "Verified" will allow the user to access the full app.</div>
                    </div>

                    {{-- Account Status --}}
                    <div class="mb-4">
                        <label class="form-label fw-600" style="font-size:13px;">Account Status</label>
                        <div class="form-check form-switch" style="margin-top:4px;">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                name="is_active"
                                value="1"
                                id="isActiveSwitch"
                                {{ old('is_active', $user->is_active) ? 'checked' : '' }}
                                style="width:44px; height:22px;"
                            >
                            <label class="form-check-label ms-2" for="isActiveSwitch" style="font-size:13px;">
                                Account Active (uncheck to deactivate / ban)
                            </label>
                        </div>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-success px-4" style="border-radius:10px; font-weight:600;">
                            <i class="bi bi-check-lg me-1"></i> Save Changes
                        </button>
                        <a href="{{ route('admin.users.show', $user) }}" class="btn btn-outline-secondary px-4" style="border-radius:10px;">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection
