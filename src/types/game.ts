export interface GameState {
  currentImage: string;
  currentAnswer: string;
  currentHint: string;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;
  showHint: boolean;
  gameStatus: "idle" | "playing" | "correct" | "timeout";
}

export const GAME_DURATION = 10; // seconds

