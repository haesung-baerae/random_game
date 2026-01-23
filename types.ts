
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface GuessRecord {
  value: number;
  hint: 'UP' | 'DOWN' | 'CORRECT';
  timestamp: number;
}

export interface AIResponse {
  message: string;
  emoji: string;
}
