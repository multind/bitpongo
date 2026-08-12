export interface Strategy {
  id: number;
  name: string;
  exchange_id: number;
  instalment: string;
  frequency: string;
  cron: string;
  coins: Coin[];
  condition: string;
}

export interface Coin {
  symbol: string;
  icon: string;
  checked: boolean;
  max: number;
  min: number;
  proportion: number;
  average_down: boolean;
}
