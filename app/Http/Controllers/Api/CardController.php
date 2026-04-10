<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Illuminate\Http\Request;

class CardController extends Controller
{
    // GET /cards
    public function index(Request $request)
    {
        $cards = $request->user()->cards()->latest()->get();
        return response()->json(['success' => true, 'cards' => $cards]);
    }

    // POST /cards/{card}/toggle  — freeze / toggle settings
    public function toggle(Request $request, Card $card)
    {
        $this->authorizeCard($request, $card);

        $request->validate([
            'field' => 'required|in:is_frozen,online_payments,international,atm_withdrawals,nfc_tap_pay',
        ]);

        $field    = $request->field;
        $newValue = !$card->{$field};

        $card->update([
            $field  => $newValue,
            'status' => ($field === 'is_frozen') ? ($newValue ? 'frozen' : 'active') : $card->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => ucfirst(str_replace('_', ' ', $field)) . ' ' . ($newValue ? 'enabled' : 'disabled'),
            'card'    => $card->fresh(),
        ]);
    }

    private function authorizeCard(Request $request, Card $card): void
    {
        if ($card->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }
}
