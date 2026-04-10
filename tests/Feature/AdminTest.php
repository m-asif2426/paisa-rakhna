<?php

namespace Tests\Feature;

use App\Models\KycDocument;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminTest extends TestCase
{
    // ────────────────────────────────────────────────────────────────────────
    // Admin Login (web session-based)
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_login_page_is_accessible(): void
    {
        $this->get('/admin/login')->assertOk();
    }

    public function test_admin_can_login_with_correct_credentials(): void
    {
        $admin = $this->makeAdmin(['email' => 'admin@test.pk', 'password' => \Illuminate\Support\Facades\Hash::make('secret')]);

        $this->post('/admin/login', [
            'email'    => 'admin@test.pk',
            'password' => 'secret',
        ])->assertRedirect('/admin/dashboard');
    }

    public function test_non_admin_user_cannot_login_to_admin_panel(): void
    {
        // makeUser creates a regular (non-admin) user
        $user = $this->makeUser([
            'email'    => 'user@test.pk',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
        ]);

        $this->post('/admin/login', [
            'email'    => 'user@test.pk',
            'password' => 'secret',
        ])->assertSessionHasErrors('email');
    }

    public function test_admin_login_fails_with_wrong_password(): void
    {
        $this->makeAdmin(['email' => 'admin@test.pk']);

        $this->post('/admin/login', [
            'email'    => 'admin@test.pk',
            'password' => 'wrongpassword',
        ])->assertSessionHasErrors('email');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Admin Dashboard
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_dashboard_is_accessible_when_authenticated(): void
    {
        $admin = $this->makeAdmin();
        $this->actingAs($admin)->get('/admin/dashboard')->assertOk();
    }

    public function test_admin_dashboard_redirects_unauthenticated_users(): void
    {
        $this->get('/admin/dashboard')->assertRedirect('/admin/login');
    }

    public function test_admin_dashboard_shows_correct_stats(): void
    {
        $admin = $this->makeAdmin();
        // Create some regular users
        $this->makeUser(['phone' => '03001111111']);
        $this->makeUser(['phone' => '03002222222']);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertOk()
                 ->assertViewHas('stats')
                 ->assertViewHas('recent');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Admin Users
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_can_list_users(): void
    {
        $admin = $this->makeAdmin();
        $this->makeUser(['phone' => '03001111111']);
        $this->makeUser(['phone' => '03002222222']);

        $this->actingAs($admin)->get('/admin/users')
             ->assertOk()
             ->assertViewHas('users');
    }

    public function test_admin_users_list_excludes_admin_accounts(): void
    {
        $admin  = $this->makeAdmin(['email' => 'admin@test.pk', 'phone' => '03000000000']);
        $admin2 = $this->makeAdmin(['email' => 'admin2@test.pk', 'phone' => '03000000001']);
        $user   = $this->makeUser(['phone' => '03001111111']);

        $response = $this->actingAs($admin)->get('/admin/users');

        // Users view should only contain non-admin users
        $view     = $response->viewData('users');
        $this->assertFalse($view->contains('is_admin', true));
    }

    public function test_admin_can_search_users_by_name(): void
    {
        $admin = $this->makeAdmin();
        $this->makeUser(['name' => 'Ali Khan', 'phone' => '03001111111']);
        $this->makeUser(['name' => 'Sara Ahmed', 'phone' => '03002222222']);

        $response = $this->actingAs($admin)->get('/admin/users?search=Ali');
        $users    = $response->viewData('users');

        $this->assertTrue($users->contains('name', 'Ali Khan'));
        $this->assertFalse($users->contains('name', 'Sara Ahmed'));
    }

    public function test_admin_can_toggle_user_active_status(): void
    {
        $admin = $this->makeAdmin();
        $user  = $this->makeUser(['phone' => '03001111111']);

        $this->actingAs($admin)
             ->post("/admin/users/{$user->id}/toggle")
             ->assertRedirect();

        $this->assertFalse((bool) $user->fresh()->is_active);
    }

    public function test_admin_cannot_deactivate_another_admin(): void
    {
        $admin1 = $this->makeAdmin(['email' => 'a1@test.pk', 'phone' => '03000000000']);
        $admin2 = $this->makeAdmin(['email' => 'a2@test.pk', 'phone' => '03000000001']);

        $this->actingAs($admin1)
             ->post("/admin/users/{$admin2->id}/toggle")
             ->assertRedirect(); // redirected back with error session

        // admin2 should still be active
        $this->assertTrue((bool) $admin2->fresh()->is_active);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Admin Transactions
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_can_list_transactions(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->get('/admin/transactions')
             ->assertOk()
             ->assertViewHas('transactions');
    }

    public function test_admin_transactions_page_can_filter_by_type(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->get('/admin/transactions?type=send')
             ->assertOk();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Admin KYC
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_can_list_kyc_documents(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->get('/admin/kyc')
             ->assertOk()
             ->assertViewHas('documents');
    }

    public function test_admin_can_approve_kyc(): void
    {
        $admin = $this->makeAdmin();
        $user  = $this->makeUser(['phone' => '03001111111']);

        $kyc = KycDocument::create([
            'user_id'         => $user->id,
            'cnic'            => '3310000000000',
            'cnic_front_path' => 'kyc/1/front.jpg',
            'cnic_back_path'  => 'kyc/1/back.jpg',
            'selfie_path'     => 'kyc/1/selfie.jpg',
            'status'          => 'under_review',
        ]);

        $this->actingAs($admin)
             ->post("/admin/kyc/{$kyc->id}/approve")
             ->assertRedirect();

        $this->assertEquals('verified', $kyc->fresh()->status);
        $this->assertEquals('verified', $user->fresh()->kyc_status);
    }

    public function test_admin_can_reject_kyc_with_reason(): void
    {
        $admin = $this->makeAdmin();
        $user  = $this->makeUser(['phone' => '03001111111']);

        $kyc = KycDocument::create([
            'user_id'         => $user->id,
            'cnic'            => '3310000000000',
            'cnic_front_path' => 'kyc/1/front.jpg',
            'cnic_back_path'  => 'kyc/1/back.jpg',
            'selfie_path'     => 'kyc/1/selfie.jpg',
            'status'          => 'under_review',
        ]);

        $this->actingAs($admin)
             ->post("/admin/kyc/{$kyc->id}/reject", ['reason' => 'Images unclear'])
             ->assertRedirect();

        $this->assertEquals('rejected', $kyc->fresh()->status);
        $this->assertEquals('Images unclear', $kyc->fresh()->rejection_reason);
        $this->assertEquals('pending', $user->fresh()->kyc_status);
    }

    public function test_admin_kyc_reject_requires_reason(): void
    {
        $admin = $this->makeAdmin();
        $user  = $this->makeUser(['phone' => '03001111111']);

        $kyc = KycDocument::create([
            'user_id'         => $user->id,
            'cnic'            => '3310000000000',
            'cnic_front_path' => 'kyc/1/front.jpg',
            'cnic_back_path'  => 'kyc/1/back.jpg',
            'selfie_path'     => 'kyc/1/selfie.jpg',
            'status'          => 'under_review',
        ]);

        $this->actingAs($admin)
             ->post("/admin/kyc/{$kyc->id}/reject", [])
             ->assertSessionHasErrors('reason');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Admin Logout
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_logout_clears_session(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)
             ->post('/admin/logout')
             ->assertRedirect('/admin/login');

        $this->get('/admin/dashboard')->assertRedirect('/admin/login');
    }
}
