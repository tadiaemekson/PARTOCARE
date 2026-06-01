<?php
 
namespace App\Http\Controllers;
 
use App\Services\SyncService;
use Illuminate\Http\Request;
 
class SyncController extends Controller
{
    protected $syncService;
 
    public function __construct(SyncService $syncService)
    {
        $this->syncService = $syncService;
    }
 
    /**
     * Handle batch synchronization uploads from offline outboxes.
     */
    public function sync(Request $request)
    {
        $request->validate([
            'queue' => 'required|array',
            'queue.*.action' => 'required|string',
            'queue.*.payload' => 'required|array',
        ]);
 
        $report = $this->syncService->processBatch($request->input('queue'));
 
        return response()->json($report);
    }
}
