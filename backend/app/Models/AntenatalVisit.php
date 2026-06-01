<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 
class AntenatalVisit extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'pregnancy_id',
        'visit_date',
        'weight',
        'blood_pressure',
        'fetal_heart_rate',
        'notes',
    ];
 
    protected $casts = [
        'visit_date' => 'date',
        'weight' => 'decimal:2',
        'fetal_heart_rate' => 'integer',
    ];
 
    public function pregnancy(): BelongsTo
    {
        return $this->belongsTo(Pregnancy::class);
    }
}
