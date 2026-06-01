<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class Pregnancy extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'patient_id',
        'gravidity',
        'parity',
        'estimated_delivery_date',
        'gestational_age_weeks',
        'risk_level',
        'status',
    ];
 
    protected $casts = [
        'estimated_delivery_date' => 'date',
        'gravidity' => 'integer',
        'parity' => 'integer',
        'gestational_age_weeks' => 'integer',
    ];
 
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
 
    public function antenatalVisits(): HasMany
    {
        return $this->hasMany(AntenatalVisit::class);
    }
 
    public function labours(): HasMany
    {
        return $this->hasMany(Labour::class);
    }
}
