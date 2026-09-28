export interface SavedPaymentMethod {
  id: string;
  brand: 'QiCard' | 'Visa' | 'MasterCard' | 'ZainCash';
  last4: string;
  expiry: string;
  token: string;
  isDefault: boolean;
  holderName?: string;
}

export interface UserProfileRecord {
  uid: string;
  email: string;
  displayName: string;
  tier: 'VIP' | 'Regular' | 'Partner';
  balanceUSD: number;
  savedPaymentMethods: SavedPaymentMethod[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DepositTransaction {
  id: string;
  amountUSD: number;
  paymentMethod: string;
  referenceNumber: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}
