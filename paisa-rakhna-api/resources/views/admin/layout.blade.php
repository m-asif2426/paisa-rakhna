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
            --primary: #0d6f3f;
            --primary-light: #e8f5ee;
            --primary-dark: #094d2c;
            --sidebar-bg: #0f1923;
            --sidebar-hover: rgba(255,255,255,.06);
            --sidebar-active: rgba(13,111,63,.25);
            --sidebar-w: 260px;
            --topbar-h: 60px;
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            --border: #e5e7eb;
            --bg-page: #f3f4f6;
            --bg-card: #ffffff;
            --radius: 12px;
            --radius-sm: 8px;
            --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
            --shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
            --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05);
        }

        * { box-sizing: border-box; }
        body { background: var(--bg-page); font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif; color: var(--text-primary); margin: 0; }

        /* ── Sidebar ────────────────────────────────────────────────────────── */
        .sidebar {
            width: var(--sidebar-w);
            min-height: 100vh;
            background: var(--sidebar-bg);
            position: fixed;
            top: 0; left: 0;
            display: flex; flex-direction: column;
            z-index: 1000;
            border-right: 1px solid rgba(255,255,255,.06);
        }
        .sidebar-brand {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255,255,255,.06);
            display: flex; align-items: center; gap: 12px;
        }
        .sidebar-brand .logo-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: var(--primary);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 800; font-size: 16px;
        }
        .sidebar-brand .brand-text { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: -.2px; }
        .sidebar-brand .brand-sub { color: rgba(255,255,255,.4); font-size: 11px; font-weight: 500; }

        .sidebar-section { padding: 16px 16px 8px; color: rgba(255,255,255,.35); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .sidebar nav { flex: 1; padding: 8px 0; overflow-y: auto; }
        .sidebar nav a {
            display: flex; align-items: center; gap: 12px;
            padding: 10px 20px;
            margin: 1px 8px;
            color: rgba(255,255,255,.55);
            text-decoration: none;
            font-size: 13.5px;
            font-weight: 500;
            border-radius: var(--radius-sm);
            transition: all .15s;
            position: relative;
        }
        .sidebar nav a:hover { color: rgba(255,255,255,.85); background: var(--sidebar-hover); }
        .sidebar nav a.active {
            color: #fff; background: var(--sidebar-active);
            font-weight: 600;
        }
        .sidebar nav a.active::before {
            content: '';
            position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
            background: var(--primary); border-radius: 0 3px 3px 0;
        }
        .sidebar nav a i { font-size: 16px; width: 20px; text-align: center; opacity: .8; }
        .sidebar nav a .nav-badge {
            margin-left: auto; background: #ef4444; color: #fff;
            font-size: 10px; font-weight: 700; padding: 2px 7px;
            border-radius: 10px; min-width: 20px; text-align: center;
        }

        .sidebar-footer {
            padding: 16px 20px;
            border-top: 1px solid rgba(255,255,255,.06);
        }
        .sidebar-footer .admin-info {
            display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
        }
        .sidebar-footer .admin-avatar {
            width: 34px; height: 34px; border-radius: 8px;
            background: var(--primary); display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 700; font-size: 13px;
        }
        .sidebar-footer .admin-name { color: rgba(255,255,255,.85); font-size: 13px; font-weight: 600; }
        .sidebar-footer .admin-role { color: rgba(255,255,255,.4); font-size: 11px; }
        .sidebar-footer form button {
            width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
            color: rgba(255,255,255,.55); padding: 8px; border-radius: var(--radius-sm);
            font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all .15s;
            display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .sidebar-footer form button:hover { background: rgba(239,68,68,.15); color: #fca5a5; border-color: rgba(239,68,68,.2); }

        /* ── Main Content ───────────────────────────────────────────────────── */
        .main-wrap { margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; }

        .topbar {
            background: var(--bg-card);
            height: var(--topbar-h);
            padding: 0 28px;
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            position: sticky; top: 0; z-index: 50;
            box-shadow: var(--shadow-sm);
        }
        .topbar h1 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar .env-badge {
            background: #fef3c7; color: #92400e;
            padding: 4px 10px; border-radius: 20px;
            font-size: 11px; font-weight: 600;
        }
        .topbar .time-badge {
            color: var(--text-muted); font-size: 12px; font-weight: 500;
        }

        .content { padding: 24px 28px; flex: 1; }

        /* ── Cards ──────────────────────────────────────────────────────────── */
        .stat-card {
            background: var(--bg-card);
            border-radius: var(--radius);
            padding: 20px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            height: 100%;
            transition: box-shadow .15s;
        }
        .stat-card:hover { box-shadow: var(--shadow); }
        .stat-card .label { font-size: 12px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 8px; }
        .stat-card .value { font-size: 26px; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
        .stat-card .sub { font-size: 11.5px; color: var(--text-muted); margin-top: 6px; }
        .stat-card .icon {
            width: 42px; height: 42px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
        }
        .stat-card .trend-up { color: #059669; font-size: 12px; font-weight: 600; }
        .stat-card .trend-down { color: #dc2626; font-size: 12px; font-weight: 600; }

        /* ── Panel / Table Card ─────────────────────────────────────────────── */
        .panel, .card-panel {
            background: var(--bg-card);
            border-radius: var(--radius);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
        }
        .panel-head {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
        }
        .panel-head .panel-title { font-weight: 700; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .panel-head .panel-title i { color: var(--text-muted); }
        .panel-body { padding: 20px; }

        /* ── Tables ─────────────────────────────────────────────────────────── */
        .table { margin-bottom: 0; }
        .table thead th {
            font-size: 11px; text-transform: uppercase; letter-spacing: .5px;
            color: var(--text-secondary); font-weight: 700; border-top: none;
            padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid var(--border);
            white-space: nowrap;
        }
        .table tbody td { padding: 12px 16px; font-size: 13px; vertical-align: middle; border-bottom: 1px solid #f3f4f6; }
        .table tbody tr:hover { background: #f9fafb; }
        .table tbody tr:last-child td { border-bottom: none; }

        /* ── Status Badges ──────────────────────────────────────────────────── */
        .badge-status {
            font-size: 11px; font-weight: 600; padding: 3px 10px;
            border-radius: 20px; text-transform: capitalize; display: inline-block;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger  { background: #fee2e2; color: #991b1b; }
        .badge-info    { background: #dbeafe; color: #1e40af; }
        .badge-muted   { background: #f3f4f6; color: #6b7280; }
        .badge-critical { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        /* ── Dynamic Status Badges (from database values) ───────────────── */
        .badge-completed { background: #dcfce7; color: #166534; }
        .badge-pending   { background: #fef3c7; color: #92400e; }
        .badge-failed    { background: #fee2e2; color: #991b1b; }
        .badge-reversed  { background: #f3f4f6; color: #6b7280; }
        .badge-active    { background: #dcfce7; color: #166534; }
        .badge-inactive  { background: #fee2e2; color: #991b1b; }
        .badge-under_review { background: #dbeafe; color: #1e40af; }
        .badge-verified  { background: #dcfce7; color: #166534; }
        .badge-rejected  { background: #fee2e2; color: #991b1b; }

        /* ── Buttons ────────────────────────────────────────────────────────── */
        .btn-primary-custom {
            background: var(--primary); border: none; color: #fff;
            border-radius: var(--radius-sm); font-size: 13px; font-weight: 600;
            padding: 8px 16px; transition: background .15s;
        }
        .btn-primary-custom:hover { background: var(--primary-dark); color: #fff; }
        .btn-outline-custom {
            background: transparent; border: 1px solid var(--border); color: var(--text-secondary);
            border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
            padding: 7px 14px; transition: all .15s;
        }
        .btn-outline-custom:hover { border-color: var(--primary); color: var(--primary); }

        /* ── Filter Bar ─────────────────────────────────────────────────────── */
        .filter-bar {
            background: var(--bg-card); border-radius: var(--radius);
            border: 1px solid var(--border); padding: 16px 20px;
            box-shadow: var(--shadow-sm); margin-bottom: 20px;
        }
        .filter-bar .form-control, .filter-bar .form-select {
            border-radius: var(--radius-sm); font-size: 13px;
            border: 1px solid var(--border); padding: 7px 12px;
        }
        .filter-bar .form-control:focus, .filter-bar .form-select:focus {
            border-color: var(--primary); box-shadow: 0 0 0 3px rgba(13,111,63,.1);
        }
        .filter-bar label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .3px; }

        /* ── Pagination ─────────────────────────────────────────────────────── */
        .pagination { margin-top: 16px; }
        .pagination .page-link {
            font-size: 13px; border-radius: var(--radius-sm) !important;
            margin: 0 2px; border: 1px solid var(--border); color: var(--text-secondary);
        }
        .pagination .page-item.active .page-link { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pagination .page-link:hover { background: var(--primary-light); color: var(--primary); }

        /* ── Alerts ─────────────────────────────────────────────────────────── */
        .alert { border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 500; border: none; }
        .alert-success { background: #dcfce7; color: #166534; }
        .alert-danger  { background: #fee2e2; color: #991b1b; }

        /* ── Misc ───────────────────────────────────────────────────────────── */
        .text-mono { font-family: 'SF Mono', 'Consolas', monospace; font-size: 12px; }
        .empty-state { text-align: center; padding: 48px 24px; color: var(--text-muted); }
        .empty-state i { font-size: 40px; margin-bottom: 12px; display: block; }
        .empty-state p { font-size: 14px; margin: 0; }

        @media (max-width: 768px) {
            .sidebar { display: none; }
            .main-wrap { margin-left: 0; }
        }
    </style>
    @yield('head')
</head>
<body>

@php
    $unreadNotifs = \App\Models\AdminNotification::where('is_read', false)->count();
@endphp

<div class="sidebar">
    <div class="sidebar-brand">
        <div class="logo-icon">PR</div>
        <div>
            <div class="brand-text">Paisa Rakhna</div>
            <div class="brand-sub">Banking Admin</div>
        </div>
    </div>
    <nav>
        <div class="sidebar-section">Main</div>
        <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
            <i class="bi bi-grid-1x2-fill"></i> Dashboard
        </a>
        <a href="{{ route('admin.users') }}" class="{{ request()->routeIs('admin.users*') ? 'active' : '' }}">
            <i class="bi bi-people-fill"></i> Users
        </a>
        <a href="{{ route('admin.transactions') }}" class="{{ request()->routeIs('admin.transactions*') ? 'active' : '' }}">
            <i class="bi bi-arrow-left-right"></i> Transactions
        </a>

        <div class="sidebar-section">Compliance</div>
        <a href="{{ route('admin.kyc') }}" class="{{ request()->routeIs('admin.kyc*') ? 'active' : '' }}">
            <i class="bi bi-shield-check"></i> KYC Verification
        </a>

        <div class="sidebar-section">Monitoring</div>
        <a href="{{ route('admin.reports') }}" class="{{ request()->routeIs('admin.reports*') ? 'active' : '' }}">
            <i class="bi bi-bar-chart-line-fill"></i> Reports & Analytics
        </a>
        <a href="{{ route('admin.audit-logs') }}" class="{{ request()->routeIs('admin.audit-logs*') ? 'active' : '' }}">
            <i class="bi bi-journal-text"></i> Audit Logs
        </a>
        <a href="{{ route('admin.security-logs') }}" class="{{ request()->routeIs('admin.security-logs*') ? 'active' : '' }}">
            <i class="bi bi-shield-exclamation"></i> Security Logs
        </a>
        <a href="{{ route('admin.notifications') }}" class="{{ request()->routeIs('admin.notifications*') ? 'active' : '' }}">
            <i class="bi bi-bell-fill"></i> Notifications
            @if($unreadNotifs > 0)
                <span class="nav-badge">{{ $unreadNotifs }}</span>
            @endif
        </a>

        <div class="sidebar-section">Configuration</div>
        <a href="{{ route('admin.rates') }}" class="{{ request()->routeIs('admin.rates*') ? 'active' : '' }}">
            <i class="bi bi-graph-up-arrow"></i> Rates
        </a>
        <a href="{{ route('admin.settings') }}" class="{{ request()->routeIs('admin.settings*') ? 'active' : '' }}">
            <i class="bi bi-gear-fill"></i> System Settings
        </a>
    </nav>
    <div class="sidebar-footer">
        <div class="admin-info">
            <div class="admin-avatar">{{ strtoupper(substr(auth()->user()->name ?? 'A', 0, 1)) }}</div>
            <div>
                <div class="admin-name">{{ auth()->user()->name ?? 'Admin' }}</div>
                <div class="admin-role">Super Admin</div>
            </div>
        </div>
        <form method="POST" action="{{ route('admin.logout') }}">
            @csrf
            <button type="submit"><i class="bi bi-box-arrow-left"></i> Sign Out</button>
        </form>
    </div>
</div>

<div class="main-wrap">
    <div class="topbar">
        <h1>@yield('page-title', 'Dashboard')</h1>
        <div class="topbar-right">
            <span class="env-badge"><i class="bi bi-hdd-network me-1"></i>Local Network</span>
            <span class="time-badge">{{ now()->format('D, d M Y') }}</span>
        </div>
    </div>

    <div class="content">
        @if(session('success'))
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle me-1"></i> {{ session('success') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif
        @if(session('error'))
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle me-1"></i> {{ session('error') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif

        @yield('content')
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
@yield('scripts')
</body>
</html>
