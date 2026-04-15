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
}
