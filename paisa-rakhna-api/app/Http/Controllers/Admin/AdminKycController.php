<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KycDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminKycController extends Controller
{
    public function index(Request $request)
    {
        $query = KycDocument::with('user')->latest();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $documents = $query->paginate(20)->withQueryString();
        $statuses  = ['pending', 'under_review', 'verified', 'rejected'];

        return view('admin.kyc', compact('documents', 'statuses'));
    }

    public function approve(KycDocument $kyc)
    {
        $kyc->update([
            'status'      => 'verified',
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        $kyc->user->update(['kyc_status' => 'verified']);

        return back()->with('success', "KYC for \"{$kyc->user->name}\" approved.");
    }

    public function reject(Request $request, KycDocument $kyc)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $kyc->update([
            'status'           => 'rejected',
            'reviewed_at'      => now(),
            'rejection_reason' => $request->reason,
        ]);

        $kyc->user->update(['kyc_status' => 'pending']);

        return back()->with('success', "KYC for \"{$kyc->user->name}\" rejected.");
    }

    public function reset(KycDocument $kyc)
    {
        $kyc->update([
            'status'           => 'pending',
            'reviewed_at'      => null,
            'rejection_reason' => null,
        ]);

        $kyc->user->update(['kyc_status' => 'pending']);

        return back()->with('success', "KYC for \"{$kyc->user->name}\" reset to pending. User can resubmit.");
    }

    /**
     * Serve KYC document image securely (protected — admin only).
     * Route: GET /admin/kyc/{kyc}/image/{type}
     * type = front | back | selfie
     */
    public function serveImage(KycDocument $kyc, string $type)
    {
        $pathMap = [
            'front'  => $kyc->cnic_front_path,
            'back'   => $kyc->cnic_back_path,
            'selfie' => $kyc->selfie_path,
        ];

        if (!array_key_exists($type, $pathMap) || empty($pathMap[$type])) {
            abort(404, 'Image not found.');
        }

        $path = $pathMap[$type];

        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'File not found on disk.');
        }

        $fullPath  = Storage::disk('public')->path($path);
        $mimeType  = mime_content_type($fullPath) ?: 'image/jpeg';

        return response()->file($fullPath, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline',
            'Cache-Control'       => 'no-store, private',
        ]);
    }
}
