import { db, type SyncQueueItem } from './db';

type SyncListener = (isOnline: boolean, pendingCount: number) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    // Listen to network status updates in the browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  // --- Listener Management ---

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Initial call
    this.getPendingCount().then(count => {
      listener(this.isOnline(), count);
    });
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners() {
    const isOnline = this.isOnline();
    const count = await this.getPendingCount();
    this.listeners.forEach(listener => listener(isOnline, count));
  }

  // --- Network Helpers ---

  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  async getPendingCount(): Promise<number> {
    return await db.sync_queue.where('status').equals('PENDING').count();
  }

  private async handleNetworkChange(online: boolean) {
    console.log(`Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
    await this.notifyListeners();
    if (online) {
      this.syncOutbox();
    }
  }

  // --- Synchronize Outbox (Outbox Pattern) ---

  async syncOutbox(): Promise<void> {
    if (this.isSyncing) return;
    if (!this.isOnline()) {
      console.log('Sync postponed: Device is currently offline.');
      return;
    }

    const pendingItems = await db.sync_queue
      .where('status')
      .equals('PENDING')
      .toArray();

    if (pendingItems.length === 0) {
      return;
    }

    console.log(`Starting sync of ${pendingItems.length} clinical operations to the cloud...`);
    this.isSyncing = true;
    await this.notifyListeners();

    try {
      for (const item of pendingItems) {
        if (!item.id) continue;

        // Set status to syncing in IndexedDB
        await db.sync_queue.update(item.id, { status: 'SYNCING' });

        // Simulate API request upload to backend
        const success = await this.uploadToServer(item);

        if (success) {
          // Remove from sync outbox once successfully processed
          await db.sync_queue.delete(item.id);
          console.log(`Synced action successfully: ${item.action}`);
        } else {
          // Revert to pending on failure
          await db.sync_queue.update(item.id, { status: 'PENDING' });
          break; // Stop execution on error to preserve FIFO ordering
        }
      }
    } catch (err) {
      console.error('Failed to run outbox sync queue:', err);
    } finally {
      this.isSyncing = false;
      await this.notifyListeners();
    }
  }

  // Upload queue item to server
  private async uploadToServer(item: SyncQueueItem): Promise<boolean> {
    try {
      const token = localStorage.getItem('partocare_api_token');
      if (!token) {
        console.warn('Sync postponed: No authenticated session/token found.');
        return false;
      }
 
      const response = await fetch('http://127.0.0.1:8000/api/v1/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          queue: [
            {
              id: item.id,
              action: item.action,
              payload: item.payload
            }
          ]
        })
      });
 
      if (!response.ok) {
        console.error(`Sync server error (${response.status}) for action ${item.action}`);
        return false;
      }
 
      const data = await response.json();
      return data.success === true && (!data.errors || data.errors.length === 0);
    } catch (err) {
      console.error('Error during sync network request:', err);
      return false;
    }
  }
}

export const syncManager = new SyncManager();
