export enum CallState {
  IDLE = 'IDLE',
  CREATING_OFFER = 'CREATING_OFFER',
  WAITING_FOR_ANSWER = 'WAITING_FOR_ANSWER',
  JOINING = 'JOINING',
  CREATING_ANSWER = 'CREATING_ANSWER',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  MEDIA_ERROR = 'MEDIA_ERROR',
}

export interface CallHistoryEntry {
  id: string;
  timestamp: number;
  duration: number; // in seconds
  alias?: string;
}

export interface PinnedEntry {
  id: string;
  alias?: string;
}
