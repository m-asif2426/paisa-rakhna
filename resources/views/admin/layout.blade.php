<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin') — Paisa Rakhna</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        :root {
            --green: #00C853;
            --green-dark: #00962e;
            --sidebar-w: 240px;
        }
        body { background: #f4f6f9; font-family: 'Segoe UI', sans-serif; }

        /* Sidebar */
        .sidebar {
            width: var(--sidebar-w);
            min-height: 100vh;
            background: #1a1a2e;
            position: fixed;
            top: 0; left: 0;
            display: flex; flex-direction: column;
            z-index: 100;
        }
        .sidebar-brand {
            padding: 20px 20px 16px;
            border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .sidebar-brand span.logo {
            display: inline-block;
            background: var(--green);
            color: #fff;
            font-weight: 900;
            font-size: 18px;
            padding: 4px 10px;
            border-radius: 8px;
            letter-spacing: -.3px;
        }
        .sidebar-brand small { color: rgba(255,255,255,.45); font-size: 11px; display: block; margin-top: 4px; }
        .sidebar nav { padding: 12px 0; flex: 1; }
        .sidebar nav a {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 20px;
            color: rgba(255,255,255,.65);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all .15s;
            border-left: 3px solid transparent;
        }
        .sidebar nav a:hover,
        .sidebar nav a.active {
            color: #fff;
            background: rgba(255,255,255,.07);
            border-left-color: var(--green);
        }
        .sidebar nav a i { font-size: 16px; width: 20px; }
        .sidebar-footer {
            padding: 16px 20px;
            border-top: 1px solid rgba(255,255,255,.08);
        }
        .sidebar-footer form button {
            width: 100%;
            background: rgba(255,255,255,.08);
            border: none;
            color: rgba(255,255,255,.65);
            padding: 8px;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: background .15s;
        }
        .sidebar-footer form button:hover { background: rgba(220,53,69,.3); color: #ff6b6b; }

        /* Main */
        .main-wrap { margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; }
        .topbar {
            background: #fff;
            padding: 14px 28px;
            border-bottom: 1px solid #e8ecf0;
            display: flex; align-items: center; justify-content: space-between;
        }
        .topbar h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
        .topbar .badge-admin {
            background: var(--green);
            color: #fff;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .content { padding: 28px; flex: 1; }

        /* Cards */
        .stat-card {
            background: #fff;
            border-radius: 14px;
            padding: 20px 22px;
            border: 1px solid #e8ecf0;
            height: 100%;
        }
        .stat-card .label { font-size: 12px; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .stat-card .value { font-size: 28px; font-weight: 900; color: #1a1a2e; line-height: 1; }
        .stat-card .icon {
            width: 44px; height: 44px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px;
        }

        /* Table */
        .card-panel { background: #fff; border-radius: 14px; border: 1px solid #e8ecf0; overflow: hidden; }
        .card-panel .panel-head { padding: 16px 20px; border-bottom: 1px solid #e8ecf0; font-weight: 700; font-size: 15px; color: #1a1a2e; }
        .table th { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #6c757d; font-weight: 700; border-top: none; }
        .table td { font-size: 13px; vertical-align: middle; }

        /* Badges */
        .badge-completed { background: #d4edda; color: #155724; }
        .badge-pending   { background: #fff3cd; color: #856404; }
        .badge-failed    { background: #f8d7da; color: #721c24; }
        .badge-reversed  { background: #e2e3e5; color: #383d41; }
        .badge-active    { background: #d4edda; color: #155724; }
        .badge-inactive  { background: #f8d7da; color: #721c24; }

        /* Pagination */
        .pagination .page-link { font-size: 13px; border-radius: 8px !important; margin: 0 2px; }
        .pagination .page-item.active .page-link { background: var(--green); border-color: var(--green); }
    </style>
</head>
<body>

<div class="sidebar">
    <div class="sidebar-brand">
        <span class="logo">💚 Paisa</span>
        <small>Admin Panel</small>
    </div>
    <nav>
        <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
            <i class="bi bi-speedometer2"></i> Dashboard
        </a>
        <a href="{{ route('admin.users') }}" class="{{ request()->routeIs('admin.users') ? 'active' : '' }}">
            <i class="bi bi-people"></i> Users
        </a>
        <a href="{{ route('admin.transactions') }}" class="{{ request()->routeIs('admin.transactions') ? 'active' : '' }}">
            <i class="bi bi-arrow-left-right"></i> Transactions
        </a>
        <a href="{{ route('admin.kyc') }}" class="{{ request()->routeIs('admin.kyc*') ? 'active' : '' }}">
            <i class="bi bi-patch-check"></i> KYC Requests
        </a>
    </nav>
    <div class="sidebar-footer">
        <form method="POST" action="{{ route('admin.logout') }}">
            @csrf
            <button type="submit"><i class="bi bi-box-arrow-left me-1"></i> Logout</button>
        </form>
    </div>
</div>

<div class="main-wrap">
    <div class="topbar">
        <h1>@yield('page-title', 'Dashboard')</h1>
        <span class="badge-admin"><i class="bi bi-shield-check me-1"></i>{{ auth()->user()->name }}</span>
    </div>

    <div class="content">
        @if(session('success'))
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                {{ session('success') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif
        @if(session('error'))
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                {{ session('error') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif

        @yield('content')
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
