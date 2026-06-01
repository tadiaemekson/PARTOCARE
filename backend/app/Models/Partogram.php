<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class Partogram extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'labour_id',
        'started_at',
        'completed_at',
        'status',
    ];
 
    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
 
    public function labour(): BelongsTo
    {
        return $this->belongsTo(Labour::class);
    }
 
    public function entries(): HasMany
    {
        return $this->hasMany(PartogramEntry::class);
    }
}
