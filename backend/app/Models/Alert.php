<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 
class Alert extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'labour_id',
        'partogram_entry_id',
        'alert_level',
        'alert_type',
        'alert_message',
        'generated_at',
        'resolved_at',
    ];
 
    protected $casts = [
        'generated_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];
 
    public function labour(): BelongsTo
    {
        return $this->belongsTo(Labour::class);
    }
 
    public function entry(): BelongsTo
    {
        return $this->belongsTo(PartogramEntry::class, 'partogram_entry_id');
    }
}
