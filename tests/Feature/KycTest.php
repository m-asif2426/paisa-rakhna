<?php

namespace Tests\Feature;

use App\Models\KycDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KycTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // GET /kyc
    // ────────────────────────────────────────────────────────────────────────

    public function test_authenticated_user_can_fetch_kyc_status(): void
    {
        $user = $this->makeUser(); // kyc_status = pending

        $this->getJson('/api/kyc', $this->authHeader($user))
             ->assertOk()
             ->assertJsonPath('success', true)
             ->assertJsonPath('kyc_status', 'pending')
             ->assertJsonPath('document', null);
    }

    public function test_kyc_status_requires_authentication(): void
    {
        $this->getJson('/api/kyc')->assertUnauthorized();
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /kyc/submit
    // ────────────────────────────────────────────────────────────────────────

    public function test_user_can_submit_kyc_documents(): void
    {
        Storage::fake('public');
        $user = $this->makeUser();

        $response = $this->postJson('/api/kyc/submit', [
            'cnic'       => '3310000000000',
            'cnic_front' => UploadedFile::fake()->image('front.jpg', 800, 600),
            'cnic_back'  => UploadedFile::fake()->image('back.jpg', 800, 600),
            'selfie'     => UploadedFile::fake()->image('selfie.jpg', 800, 600),
        ], $this->authHeader($user));

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('status', 'under_review');

        $this->assertDatabaseHas('kyc_documents', [
            'user_id' => $user->id,
            'status'  => 'under_review',
        ]);

        $this->assertDatabaseHas('users', [
            'id'         => $user->id,
            'kyc_status' => 'pending',
        ]);
    }

    public function test_kyc_submit_stores_files_on_disk(): void
    {
        Storage::fake('public');
        $user = $this->makeUser();

        $this->postJson('/api/kyc/submit', [
            'cnic'       => '3310000000000',
            'cnic_front' => UploadedFile::fake()->image('front.jpg'),
            'cnic_back'  => UploadedFile::fake()->image('back.jpg'),
            'selfie'     => UploadedFile::fake()->image('selfie.jpg'),
        ], $this->authHeader($user));

        $kyc = KycDocument::where('user_id', $user->id)->latest()->first();
        Storage::disk('public')->assertExists($kyc->cnic_front_path);
        Storage::disk('public')->assertExists($kyc->cnic_back_path);
        Storage::disk('public')->assertExists($kyc->selfie_path);
    }

    public function test_kyc_submit_fails_if_already_verified(): void
    {
        Storage::fake('public');
        $user = $this->makeUser();
        $user->update(['kyc_status' => 'verified']);

        $this->postJson('/api/kyc/submit', [
            'cnic'       => '3310000000000',
            'cnic_front' => UploadedFile::fake()->image('front.jpg'),
            'cnic_back'  => UploadedFile::fake()->image('back.jpg'),
            'selfie'     => UploadedFile::fake()->image('selfie.jpg'),
        ], $this->authHeader($user))->assertStatus(422);
    }

    public function test_kyc_submit_requires_all_fields(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/kyc/submit', [
            'cnic' => '3310000000000',
            // missing cnic_front, cnic_back, selfie
        ], $this->authHeader($user))->assertUnprocessable();
    }

    public function test_kyc_submit_requires_authentication(): void
    {
        $this->postJson('/api/kyc/submit', [])->assertUnauthorized();
    }

    public function test_kyc_submit_returns_document_on_subsequent_fetch(): void
    {
        Storage::fake('public');
        $user = $this->makeUser();

        $this->postJson('/api/kyc/submit', [
            'cnic'       => '3310000000000',
            'cnic_front' => UploadedFile::fake()->image('front.jpg'),
            'cnic_back'  => UploadedFile::fake()->image('back.jpg'),
            'selfie'     => UploadedFile::fake()->image('selfie.jpg'),
        ], $this->authHeader($user));

        $this->getJson('/api/kyc', $this->authHeader($user))
             ->assertOk()
             ->assertJsonStructure(['document' => [
                 'id', 'cnic', 'status', 'has_front', 'has_back', 'has_selfie', 'submitted_at',
             ]]);
    }
}
