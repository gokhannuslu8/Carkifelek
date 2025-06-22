export interface WheelOption {
  id: string;
  text: string;
  percentage: number;
  color: string;
}

export interface WheelStats {
  totalSpins: number;
  lastSpinTime: number;
  optionStats: { [key: string]: number };
}

export interface WheelState {
  options: WheelOption[];
  stats: WheelStats;
  isSpinning: boolean;
  currentRotation: number;
}

export type RootStackParamList = {
  Home: undefined;
  Admin: undefined;
  Result: { winner: string };
}; 