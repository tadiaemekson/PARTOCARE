<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 
class Referral extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'labour_id',
        'source_facility_id',
        'destination_facility_id',
        'initiated_by',
        'reason',
        'referral_status',
        'departure_time',
        'arrival_time',
        'ambulance_id',
    ];
 
    protected $casts = [
        'departure_time' => 'datetime',
        'arrival_time' => 'datetime',
    ];
 
    public function labour(): BelongsTo
    {
        return $this->belongsTo(Labour::class);
    }
 
    public function sourceFacility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'source_facility_id');
    }
 
    public function destinationFacility(): BelongsTo
    {
        return $this->belongsTo(Facility::class, 'destination_facility_id');
    }
 
    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }
 
    public function ambulance(): BelongsTo
    {
        return $this->belongsTo(Ambulance::class);
    }
}
