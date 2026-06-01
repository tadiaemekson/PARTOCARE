<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class Ambulance extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'facility_id',
        'registration_number',
        'driver_name',
        'driver_phone',
        'status',
    ];
 
    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }
 
    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }
}
