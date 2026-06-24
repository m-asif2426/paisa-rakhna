<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login — Paisa Rakhna</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #00C853 0%, #00962e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
        }
        .login-card {
            background: #fff;
            border-radius: 20px;
            padding: 40px 36px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0,0,0,.15);
        }
        .logo-wrap {
            text-align: center;
            margin-bottom: 28px;
        }
        .logo-wrap .logo {
            display: inline-block;
            background: #00C853;
            color: #fff;
            font-weight: 900;
            font-size: 22px;
            padding: 6px 16px;
            border-radius: 10px;
            letter-spacing: -.3px;
        }
        .logo-wrap h2 {
            font-size: 20px;
            font-weight: 800;
            color: #1a1a2e;
            margin-top: 14px;
            margin-bottom: 4px;
        }
        .logo-wrap p { font-size: 13px; color: #6c757d; }
        .form-label { font-size: 13px; font-weight: 600; color: #1a1a2e; }
        .form-control {
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 14px;
            border: 1.5px solid #e8ecf0;
        }
        .form-control:focus { border-color: #00C853; box-shadow: 0 0 0 3px rgba(0,200,83,.15); }
        .btn-login {
            background: #00C853;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 12px;
            font-size: 15px;
            font-weight: 700;
            width: 100%;
            cursor: pointer;
            transition: background .15s;
        }
        .btn-login:hover { background: #00962e; color: #fff; }
        .invalid-feedback { font-size: 12px; }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="logo-wrap">
            <span class="logo">💚 Paisa Rakhna</span>
            <h2>Admin Panel</h2>
            <p>Sign in with your admin credentials</p>
        </div>

        <form method="POST" action="{{ route('admin.login.post') }}">
            @csrf

            <div class="mb-3">
                <label class="form-label">Email Address</label>
                <input
                    type="email"
                    name="email"
                    class="form-control @error('email') is-invalid @enderror"
                    value="{{ old('email') }}"
                    placeholder="admin@paisa.pk"
                    autofocus
                    required
                >
                @error('email')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <div class="mb-4">
                <label class="form-label">Password</label>
                <input
                    type="password"
                    name="password"
                    class="form-control @error('password') is-invalid @enderror"
                    placeholder="••••••••"
                    required
                >
                @error('password')
                    <div class="invalid-feedback">{{ $message }}</div>
                @enderror
            </div>

            <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" name="remember" id="remember">
                <label class="form-check-label" for="remember" style="font-size:13px;">Remember me</label>
            </div>

            <button type="submit" class="btn-login">Sign In →</button>
        </form>
    </div>
</body>
</html>
