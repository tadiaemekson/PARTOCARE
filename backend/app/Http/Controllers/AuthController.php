<?php
 
namespace App\Http\Controllers;
 
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
 
class AuthController extends Controller
{
    /**
     * Authenticate clinical users and issue Sanctum token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
 
        $user = User::where('email', $request->email)->first();
 
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Identifiants incorrects ou compte inexistant.'
            ], 401);
        }
 
        // Force account status check
        if ($user->status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Ce compte a été suspendu ou désactivé.'
            ], 403);
        }
 
        $token = $user->createToken('api-token')->plainTextToken;
 
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => [
                    'id' => $user->role_id,
                    'name' => $user->role->name,
                ],
                'facility' => [
                    'id' => $user->facility_id,
                    'name' => $user->facility->name,
                    'type' => $user->facility->type,
                ]
            ]
        ]);
    }
}
