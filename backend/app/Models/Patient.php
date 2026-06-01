<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
 
class Patient extends Model
{
    use HasUuids;
 
    protected $fillable = [
        'patient_code',
        'first_name',
        'last_name',
        'date_of_birth',
        'phone',
        'address',
        'blood_group',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];
 
    protected $casts = [
        'date_of_birth' => 'date',
    ];
 
    public function pregnancies(): HasMany
    {
        return $this->hasMany(Pregnancy::class);
    }
}
