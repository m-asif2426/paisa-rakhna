<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $purpose = 'register',
    ) {}

    public function envelope(): Envelope
    {
        $subjects = [
            'register'  => 'Your Paisa Rakhna Verification Code',
            'reset_pin' => 'Reset Your Paisa Rakhna PIN',
        ];

        return new Envelope(
            subject: $subjects[$this->purpose] ?? 'Your Paisa Rakhna OTP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
