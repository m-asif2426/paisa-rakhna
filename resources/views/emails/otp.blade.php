<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Paisa Rakhna OTP</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
        <tr>
            <td align="center">
                <!-- Card -->
                <table width="480" cellpadding="0" cellspacing="0"
                       style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

                    <!-- Header gradient -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 40px;text-align:center;">
                            <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px;">
                                💰 Paisa Rakhna
                            </p>
                            <p style="margin:8px 0 0;font-size:13px;color:#a0aec0;letter-spacing:2px;text-transform:uppercase;">
                                Secure · Simple · Smart
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 40px 20px;">
                            @if($purpose === 'reset_pin')
                            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a202c;">Reset Your PIN</p>
                            <p style="margin:0 0 24px;font-size:15px;color:#718096;line-height:1.6;">
                                We received a request to reset your M-PIN. Use the code below to continue.
                            </p>
                            @else
                            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a202c;">Verify Your Account</p>
                            <p style="margin:0 0 24px;font-size:15px;color:#718096;line-height:1.6;">
                                Thanks for signing up! Enter the code below to verify your email address and get started.
                            </p>
                            @endif

                            <!-- OTP Box -->
                            <div style="background:#f7f8fc;border:2px dashed #e2e8f0;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
                                <p style="margin:0 0 6px;font-size:12px;color:#a0aec0;text-transform:uppercase;letter-spacing:2px;">Your One-Time Code</p>
                                <p style="margin:0;font-size:42px;font-weight:800;color:#1a1a2e;letter-spacing:12px;font-family:'Courier New',monospace;">
                                    {{ $code }}
                                </p>
                            </div>

                            <p style="margin:0 0 16px;font-size:14px;color:#718096;line-height:1.6;">
                                ⏱ This code expires in <strong style="color:#1a202c;">5 minutes</strong>.
                            </p>
                            <p style="margin:0;font-size:13px;color:#a0aec0;line-height:1.6;">
                                If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #edf2f7;margin:0;"/></td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 40px;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#a0aec0;">
                                © {{ date('Y') }} Paisa Rakhna. All rights reserved.<br/>
                                Need help? Contact us at <a href="mailto:support@paisa.pk" style="color:#4a6cf7;text-decoration:none;">support@paisa.pk</a>
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Security note below card -->
                <p style="margin:20px 0 0;font-size:12px;color:#a0aec0;text-align:center;">
                    🔒 Never share this code with anyone, including Paisa Rakhna staff.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
