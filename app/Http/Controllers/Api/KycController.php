<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KycDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KycController extends Controller
{
    // GET /kyc  — read current KYC status
    public function show(Request $request)
    {
        $user = $request->user();
        $kyc  = KycDocument::where('user_id', $user->id)->latest()->first();

        return response()->json([
            'success'    => true,
            'kyc_status' => $user->kyc_status ?? 'pending',
            'document'   => $kyc ? [
                'id'               => $kyc->id,
                'cnic'             => $kyc->cnic,
                'status'           => $kyc->status,
                'rejection_reason' => $kyc->rejection_reason,
                'has_front'        => !empty($kyc->cnic_front_path),
                'has_back'         => !empty($kyc->cnic_back_path),
                'has_selfie'       => !empty($kyc->selfie_path),
                'submitted_at'     => $kyc->created_at,
            ] : null,
        ]);
    }

    // POST /kyc/submit  — upload documents
    public function submit(Request $request)
    {
        $request->validate([
            'cnic'       => 'required|string|min:13|max:20',
            'cnic_front' => 'required|file|image|max:5120',   // max 5 MB
            'cnic_back'  => 'required|file|image|max:5120',
            'selfie'     => 'required|file|image|max:5120',
        ]);

        $user = $request->user();

        if ($user->kyc_status === 'verified') {
            return response()->json(['success' => false, 'message' => 'KYC already verified'], 422);
        }

        $dir = "kyc/{$user->id}";

        $frontPath  = $request->file('cnic_front')->store($dir, 'public');
        $backPath   = $request->file('cnic_back')->store($dir, 'public');
        $selfiePath = $request->file('selfie')->store($dir, 'public');

        // Mark old documents as superseded by creating a new record
        $kyc = KycDocument::updateOrCreate(
            ['user_id' => $user->id],
            [
                'cnic'             => preg_replace('/\D/', '', $request->cnic),
                'cnic_front_path'  => $frontPath,
                'cnic_back_path'   => $backPath,
                'selfie_path'      => $selfiePath,
                'status'           => 'under_review',
                'rejection_reason' => null,
            ]
        );

        // Update user KYC status to pending review
        $user->update(['cnic' => $kyc->cnic, 'kyc_status' => 'pending']);

        return response()->json([
            'success' => true,
            'message' => 'KYC documents submitted for review',
            'status'  => 'under_review',
        ]);
    }
}
