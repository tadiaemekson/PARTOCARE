<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
 
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids;
 
    protected $fillable = [
        'role_id',
        'facility_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'status',
    ];
 
    protected $hidden = [
        'password',
        'remember_token',
    ];
 
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
 
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
 
    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }
}
