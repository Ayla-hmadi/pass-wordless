export type SecurityType = 'biometric' | 'password';

export interface Entry {
  id: string;
  label: string;
  username: string;
  password: string;
  createdAt: number;
  updatedAt: number;
}
