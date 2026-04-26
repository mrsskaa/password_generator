export interface GeneratePasswordPayload {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export interface GeneratePasswordResponse {
  password: string;
  length: number;
  used_lower: boolean;
  used_upper: boolean;
  used_digits: boolean;
  used_symbols: boolean;
  use_similar_symbols: boolean;
  crack_time_human: string;
  crack_time_seconds: number;
  color: string;
  strength_level: string;
  hints: string[];
}
