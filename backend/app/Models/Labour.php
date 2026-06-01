<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class Labour extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'pregnancy_id',
        'facility_id',
        'admitted_by',
        'admission_datetime',
        'labour_status',
        'delivery_type',
        'outcome',
    ];
 
    protected $casts = [
        'admission_datetime' => 'datetime',
    ];
 
    public function pregnancy(): BelongsTo
    {
        return $this->belongsTo(Pregnancy::class);
    }
 
    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }
 
    public function admittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admitted_by');
    }
 
    public function partogram(): HasOne
    {
        return $this->hasOne(Partogram::class);
    }
 
    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }
 
    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }
}
