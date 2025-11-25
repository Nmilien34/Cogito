/**
 * FM Radio Service
 * Communicates with hardware-service to control TEA5767 FM radio chip
 */

import { io, Socket } from 'socket.io-client';
import { HARDWARE_SERVICE_URL } from '../config';

export interface FMRadioState {
  frequency: number;
  isPlaying: boolean;
  volume: number;
  signalStrength?: number;
  isStereo?: boolean;
}

export interface StationPreset {
  id: string;
  name: string;
  frequency: number;
}

class FMRadioService {
  private socket: Socket | null = null;
  private radioState: FMRadioState = {
    frequency: 99.1,
    isPlaying: false,
    volume: 50,
  };
  private listeners: Set<(state: FMRadioState) => void> = new Set();
  private statusPollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
    this.initializeRadioState();
  }

  /**
   * Fetch the current radio state from hardware on initialization
   */
  private async initializeRadioState() {
    try {
      await this.getStatus();
      console.log('✅ Initial radio state loaded:', this.radioState);
    } catch (error) {
      console.warn('⚠️  Could not fetch initial radio state, using defaults:', error);
    }
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(HARDWARE_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Connected to FM Radio hardware service');
      // Fetch current radio state when connected
      this.getStatus().catch(err =>
        console.warn('Could not fetch radio status on connect:', err)
      );
      this.startStatusPolling();
      this.emitStateUpdate();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from FM Radio hardware service');
      this.stopStatusPolling();
    });

    this.socket.on('radio-state-update', (state: Partial<FMRadioState>) => {
      this.radioState = { ...this.radioState, ...state };
      this.emitStateUpdate();
    });

    this.socket.on('mode-changed', ({ mode }: { mode: string }) => {
      if (mode === 'radio') {
        this.radioState.isPlaying = true;
      } else {
        this.radioState.isPlaying = false;
      }
      this.emitStateUpdate();
    });
  }

  /**
   * Start periodic polling of radio status (every 5 seconds)
   * This keeps the frontend in sync with hardware changes
   */
  private startStatusPolling() {
    if (this.statusPollInterval) return;

    this.statusPollInterval = setInterval(async () => {
      try {
        await this.getStatus();
      } catch (error) {
        // Silently fail - hardware might be temporarily unavailable
        console.debug('Status poll failed:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Stop status polling
   */
  private stopStatusPolling() {
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = null;
    }
  }

  disconnect() {
    this.stopStatusPolling();
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribe(listener: (state: FMRadioState) => void) {
    this.listeners.add(listener);
    // Immediately send current state
    listener(this.radioState);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitStateUpdate() {
    this.listeners.forEach(listener => listener(this.radioState));
  }

  async setFrequency(frequency: number): Promise<void> {
    if (frequency < 87.5 || frequency > 108.0) {
      throw new Error('Frequency must be between 87.5 and 108.0 MHz');
    }

    try {
      const response = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/frequency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency }),
      });

      if (!response.ok) {
        throw new Error('Failed to set frequency');
      }

      this.radioState.frequency = frequency;
      this.emitStateUpdate();
    } catch (error) {
      console.error('Error setting frequency:', error);
      throw error;
    }
  }

  async tuneUp(): Promise<void> {
    try {
      const response = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/tune/up`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to tune up');
      }

      const data = await response.json();
      if (data.frequency) {
        this.radioState.frequency = data.frequency;
        this.emitStateUpdate();
      }
    } catch (error) {
      console.error('Error tuning up:', error);
      throw error;
    }
  }

  async tuneDown(): Promise<void> {
    try {
      const response = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/tune/down`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to tune down');
      }

      const data = await response.json();
      if (data.frequency) {
        this.radioState.frequency = data.frequency;
        this.emitStateUpdate();
      }
    } catch (error) {
      console.error('Error tuning down:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (volume < 0 || volume > 100) {
      throw new Error('Volume must be between 0 and 100');
    }

    try {
      const response = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume }),
      });

      if (!response.ok) {
        throw new Error('Failed to set volume');
      }

      this.radioState.volume = volume;
      this.emitStateUpdate();
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  async togglePlayback(): Promise<void> {
    const newMode = this.radioState.isPlaying ? 'ai' : 'radio';

    try {
      const response = await fetch(`${HARDWARE_SERVICE_URL}/api/mode/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle playback');
      }

      this.radioState.isPlaying = !this.radioState.isPlaying;
      this.emitStateUpdate();
    } catch (error) {
      console.error('Error toggling playback:', error);
      throw error;
    }
  }

  async getStatus(): Promise<FMRadioState> {
    try {
      const response = await fetch(`${HARDWARE_SERVICE_URL}/api/radio/status`);

      if (!response.ok) {
        throw new Error('Failed to get radio status');
      }

      const data = await response.json();
      this.radioState = { ...this.radioState, ...data };
      this.emitStateUpdate();

      return this.radioState;
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  getState(): FMRadioState {
    return { ...this.radioState };
  }

  // Preset management (stored in localStorage for now)
  private readonly PRESETS_KEY = 'fm_radio_presets';

  getPresets(): StationPreset[] {
    try {
      const stored = localStorage.getItem(this.PRESETS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultPresets();
    } catch {
      return this.getDefaultPresets();
    }
  }

  private getDefaultPresets(): StationPreset[] {
    return [
      { id: '1', name: 'NPR News', frequency: 88.5 },
      { id: '2', name: 'Classical', frequency: 90.7 },
      { id: '3', name: 'Jazz FM', frequency: 99.1 },
      { id: '4', name: 'Easy Listening', frequency: 101.9 },
      { id: '5', name: 'Oldies', frequency: 103.5 },
      { id: '6', name: 'Talk Radio', frequency: 106.7 },
    ];
  }

  savePresets(presets: StationPreset[]): void {
    try {
      localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving presets:', error);
    }
  }

  addPreset(name: string, frequency: number): void {
    const presets = this.getPresets();
    const newPreset: StationPreset = {
      id: Date.now().toString(),
      name,
      frequency,
    };
    presets.push(newPreset);
    this.savePresets(presets);
  }

  removePreset(id: string): void {
    const presets = this.getPresets().filter(p => p.id !== id);
    this.savePresets(presets);
  }
}

// Export singleton instance
export const fmRadioService = new FMRadioService();
