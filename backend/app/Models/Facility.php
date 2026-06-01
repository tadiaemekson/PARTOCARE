<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class Facility extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'name',
        'type',
        'region',
        'district',
        'address',
        'phone',
        'latitude',
        'longitude',
    ];
 
    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];
 
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
 
    public function ambulances(): HasMany
    {
        return $this->hasMany(Ambulance::class);
    }
}
