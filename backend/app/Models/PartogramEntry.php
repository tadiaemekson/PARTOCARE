<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class PartogramEntry extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'partogram_id',
        'observation_time',
        'cervical_dilation',
        'fetal_heart_rate',
        'contractions_per_10min',
        'contraction_duration_secs',
        'maternal_temperature',
        'maternal_pulse',
        'systolic_bp',
        'diastolic_bp',
        'fetal_station',
        'membrane_status',
        'amniotic_fluid_status',
        'notes',
    ];
 
    protected $casts = [
        'observation_time' => 'datetime',
        'cervical_dilation' => 'decimal:1',
        'fetal_heart_rate' => 'integer',
        'contractions_per_10min' => 'integer',
        'contraction_duration_secs' => 'integer',
        'maternal_temperature' => 'decimal:1',
        'maternal_pulse' => 'integer',
        'systolic_bp' => 'integer',
        'diastolic_bp' => 'integer',
        'fetal_station' => 'integer',
    ];
 
    public function partogram(): BelongsTo
    {
        return $this->belongsTo(Partogram::class);
    }
 
    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class, 'partogram_entry_id');
    }
}
