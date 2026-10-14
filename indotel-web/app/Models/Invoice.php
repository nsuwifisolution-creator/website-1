<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';

    protected $fillable = [
        'invoice_number', 'user_id', 'subscription_id',
        'amount', 'period', 'due_date', 'status',
        'paid_at', 'payment_method', 'notes',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function subscription() { return $this->belongsTo(Subscription::class); }
}
