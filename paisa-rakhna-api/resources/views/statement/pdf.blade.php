<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>Account Statement — Paisa Rakhna</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a202c; background: #fff; padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1a1a2e; }
        .brand { font-size: 24px; font-weight: 900; color: #1a1a2e; letter-spacing: -0.5px; }
        .brand span { color: #00C853; }
        .brand small { display: block; font-size: 11px; font-weight: 400; color: #718096; margin-top: 2px; }
        .meta { text-align: right; font-size: 12px; color: #718096; }
        .meta strong { color: #1a202c; }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .info-box { background: #f7f8fc; border-radius: 10px; padding: 14px 18px; border: 1px solid #e2e8f0; }
        .info-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #a0aec0; margin-bottom: 8px; }
        .info-box p { font-size: 13px; color: #1a202c; font-weight: 600; margin-bottom: 2px; }
        .info-box small { color: #718096; font-size: 11px; }

        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
        .sum-card { background: #f7f8fc; border-radius: 10px; padding: 14px; text-align: center; border: 1px solid #e2e8f0; }
        .sum-card .lbl { font-size: 11px; color: #718096; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .sum-card .val { font-size: 18px; font-weight: 800; color: #1a202c; }
        .sum-card .val.green { color: #00962e; }
        .sum-card .val.red   { color: #c53030; }

        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead tr { background: #1a1a2e; color: #fff; }
        thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        tbody tr:nth-child(even) { background: #f7f8fc; }
        tbody tr:hover { background: #edf2f7; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }

        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: capitalize; }
        .badge-send     { background: #fed7d7; color: #c53030; }
        .badge-receive  { background: #c6f6d5; color: #276749; }
        .badge-add      { background: #bee3f8; color: #2b6cb0; }
        .badge-withdraw { background: #feebc8; color: #c05621; }
        .badge-other    { background: #e9d8fd; color: #553c9a; }

        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer small { color: #a0aec0; font-size: 11px; }
    </style>
</head>
<body>

    <div class="header">
        <div>
            <div class="brand">💰 Paisa <span>Rakhna</span></div>
            <small>Account Statement</small>
        </div>
        <div class="meta">
            <strong>{{ $user->name }}</strong><br/>
            {{ $user->phone }}<br/>
            {{ $user->wallet->account_number ?? '—' }}<br/>
            Generated: {{ now()->format('d M Y, H:i') }}
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h4>Statement Period</h4>
            <p>{{ \Carbon\Carbon::parse($from)->format('d M Y') }} — {{ \Carbon\Carbon::parse($to)->format('d M Y') }}</p>
            <small>{{ $summary['count'] }} transactions</small>
        </div>
        <div class="info-box">
            <h4>Closing Balance</h4>
            <p>PKR {{ number_format($user->wallet->balance ?? 0, 2) }}</p>
            <small>Opening: PKR {{ number_format($openingBalance, 2) }}</small>
        </div>
    </div>

    <div class="summary">
        <div class="sum-card">
            <div class="lbl">Total Credited</div>
            <div class="val green">+ PKR {{ number_format($summary['total_in'], 0) }}</div>
        </div>
        <div class="sum-card">
            <div class="lbl">Total Debited</div>
            <div class="val red">- PKR {{ number_format($summary['total_out'], 0) }}</div>
        </div>
        <div class="sum-card">
            <div class="lbl">Net Change</div>
            <div class="val {{ ($summary['total_in'] - $summary['total_out']) >= 0 ? 'green' : 'red' }}">
                PKR {{ number_format(abs($summary['total_in'] - $summary['total_out']), 0) }}
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                <th style="text-align:right">Amount (PKR)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $t)
            @php
                $isCredit = in_array($t->type, ['receive', 'add_money']);
                $types = ['send'=>'badge-send','receive'=>'badge-receive','add_money'=>'badge-add','withdrawal'=>'badge-withdraw'];
                $badgeClass = $types[$t->type] ?? 'badge-other';
            @endphp
            <tr>
                <td style="color:#718096; white-space:nowrap;">{{ $t->created_at->format('d M y') }}<br/><small>{{ $t->created_at->format('H:i') }}</small></td>
                <td style="font-family:monospace; font-size:11px; color:#4a5568;">{{ $t->reference }}</td>
                <td>{{ $t->description }}</td>
                <td><span class="badge {{ $badgeClass }}">{{ str_replace('_', ' ', $t->type) }}</span></td>
                <td><span style="font-size:11px; color:{{ $t->status === 'completed' ? '#276749' : '#c05621' }}">{{ $t->status }}</span></td>
                <td style="text-align:right; font-weight:700; color:{{ $isCredit ? '#276749' : '#c53030' }}">
                    {{ $isCredit ? '+' : '-' }} {{ number_format($t->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" style="text-align:center; color:#a0aec0; padding:32px;">No transactions found for this period.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <small>🔒 This is a system-generated statement. No signature required.</small>
        <small>© {{ date('Y') }} Paisa Rakhna · support@paisa.pk</small>
    </div>

</body>
</html>
