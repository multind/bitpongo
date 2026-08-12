export interface Exchange {
  id: number;
  name: string;
  exchange: string;
  access_key: string;
  secret_key: string;
  password: string;
  status: string;
}

export interface CreateExchangeData {
  name: string;
  exchange: string;
  access_key: string;
  secret_key: string;
  password: string;
}

export interface CheckExchangeData {
  id: number;
  exchange: string;
  access_key: string;
  secret_key: string;
  password: string;
}
