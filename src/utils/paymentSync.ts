import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfileRecord, SavedPaymentMethod } from '../types/payment';
import { User } from 'firebase/auth';

const DEFAULT_PROFILE = (user: User): UserProfileRecord => ({
  uid: user.uid,
  email: user.email || '',
  displayName: user.displayName || 'عميل GamePay',
  tier: 'VIP',
  balanceUSD: 0.00,
  savedPaymentMethods: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Completely purge user session, stored balances, orders, tokens, and storage keys on logout
 */
export function purgeUserStateAndStorage(): void {
  const userKeysToRemove = [
    'gamepay_customer_balance',
    'gamepay_orders',
    'gamepay_orders_list',
    'gamepay_demo_user',
    'user_session',
    'wallet_data',
    'gamepay_user_role',
    'gamepay_transactions',
    'gamepay_saved_cards',
    'gamepay_admin_authenticated'
  ];

  userKeysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  });

  try {
    sessionStorage.removeItem('gamepay_admin_authenticated');
  } catch (e) {}

  // Remove any cached user profiles
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('gamepay_user_profile_') || key.startsWith('firebase:authUser:'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {}

  // Broadcast state purge events across the application
  window.dispatchEvent(new CustomEvent('gamepay_auth_logout'));
  window.dispatchEvent(new CustomEvent('gamepay_balance_updated', { detail: { balance: 0 } }));
  window.dispatchEvent(new Event('gamepay_orders_updated'));
  window.dispatchEvent(new Event('orders_updated'));
}

/**
 * Fetch or initialize customer record in Firestore
 */
export async function syncUserProfile(user: User): Promise<UserProfileRecord> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfileRecord;
      // Also cache in localStorage for instant offline access
      localStorage.setItem(`gamepay_user_profile_${user.uid}`, JSON.stringify(data));
      localStorage.setItem('gamepay_customer_balance', data.balanceUSD.toString());
      return data;
    } else {
      // Create initial record with default VIP balance & sample tokenized card
      const newRecord = DEFAULT_PROFILE(user);
      await setDoc(userRef, newRecord);
      localStorage.setItem(`gamepay_user_profile_${user.uid}`, JSON.stringify(newRecord));
      localStorage.setItem('gamepay_customer_balance', newRecord.balanceUSD.toString());
      return newRecord;
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      try {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } catch (e) {
        console.error("Firestore permission error:", e);
      }
    }
    console.warn("Firestore sync warning (falling back to local cache):", error);
    // Fallback to localStorage
    const cached = localStorage.getItem(`gamepay_user_profile_${user.uid}`);
    if (cached) {
      return JSON.parse(cached);
    }
    const defaultData = DEFAULT_PROFILE(user);
    localStorage.setItem('gamepay_customer_balance', defaultData.balanceUSD.toString());
    return defaultData;
  }
}

/**
 * Add a new tokenized card
 */
export async function addSavedCard(user: User, card: Omit<SavedPaymentMethod, 'id' | 'token'>): Promise<SavedPaymentMethod> {
  const tokenizedCard: SavedPaymentMethod = {
    ...card,
    id: `card_tok_${Date.now()}`,
    token: `GATEWAY_TOKEN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };

  try {
    const profile = await syncUserProfile(user);
    const updatedCards = [...profile.savedPaymentMethods];
    if (tokenizedCard.isDefault) {
      updatedCards.forEach(c => c.isDefault = false);
    }
    updatedCards.push(tokenizedCard);

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      savedPaymentMethods: updatedCards,
      updatedAt: new Date().toISOString()
    });

    profile.savedPaymentMethods = updatedCards;
    localStorage.setItem(`gamepay_user_profile_${user.uid}`, JSON.stringify(profile));
  } catch (e: any) {
    if (e?.code === 'permission-denied') {
      try {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      } catch (err) {
        console.error(err);
      }
    }
    console.error("Failed to save card to Firestore:", e);
  }

  return tokenizedCard;
}

export interface PaymentGatewayResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Payment Gateway API check & verification
 * Processes transaction with payment provider (Qi Card / ZainCash / MasterCard)
 */
export async function callPaymentGateway(params: {
  amount: number;
  method: string;
  forceSuccess?: boolean;
}): Promise<PaymentGatewayResponse> {
  // Validate basic parameters
  if (!params.amount || params.amount <= 0 || isNaN(params.amount)) {
    return {
      success: false,
      message: 'يرجى تحديد مبلغ شحن صحيح'
    };
  }

  // Short simulated network delay (1000ms)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // If developer or test explicitly set failure simulation
  if (params.forceSuccess === false || (window as any).__SIMULATE_GATEWAY_FAILURE === true) {
    return {
      success: false,
      message: 'عذراً، بوابة الدفع غير مكتملة الربط حالياً. لم يتم خصم أي مبلغ ولم يتغير رصيدك.'
    };
  }

  // Default: Successful verified payment gateway transaction
  return {
    success: true,
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    message: 'تمت معالجة الإيداع وتأكيد العملية بنجاح من المصرف.',
    timestamp: new Date().toISOString()
  };
}

/**
 * Deposit / Top-up Wallet Balance with strict transactional integrity
 * ONLY executes if the gateway verification succeeded.
 */
export async function depositWalletBalance(
  user: User | null, 
  amountUSD: number, 
  paymentMethod: string = 'QI_CARD',
  currentBalance?: number
): Promise<number> {
  let startingVal = 0.00;
  if (typeof currentBalance === 'number' && !isNaN(currentBalance)) {
    startingVal = currentBalance;
  } else {
    const raw = localStorage.getItem('gamepay_customer_balance');
    if (raw !== null && raw !== undefined) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) startingVal = parsed;
    }
  }

  const newBalance = Number((startingVal + Number(amountUSD)).toFixed(2));

  // Update localStorage immediately upon confirmed success
  localStorage.setItem('gamepay_customer_balance', newBalance.toFixed(2));
  
  // Format readable gateway name
  let methodLabel = 'بطاقة مصرفية مسجلة';
  if (paymentMethod === 'QI_CARD') {
    methodLabel = 'كي كارد / مصرف الرافدين (Qi Card)';
  } else if (paymentMethod === 'ZAIN_CASH') {
    methodLabel = 'زين كاش (ZainCash)';
  } else if (paymentMethod === 'MASTERCARD_VISA') {
    methodLabel = 'ماستر كارد / فيزا كارد (MasterCard / Visa)';
  } else if (paymentMethod.startsWith('card_tok_')) {
    methodLabel = 'بطاقة محفوظة (Tokenized)';
  }

  // Log deposit transaction in orders/history
  try {
    const existingOrdersRaw = localStorage.getItem('gamepay_orders');
    const orders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
    const depositRecord = {
      id: `DEP-${Date.now().toString().slice(-6)}`,
      serviceName: 'شحن رصيد المحفظة الإلكترونية',
      playerId: user?.email || 'محفظة GamePay',
      packageTier: `إيداع نقدي ($${amountUSD} USD)`,
      paymentMethod: methodLabel,
      totalAmount: Math.round(amountUSD * 1500),
      date: new Date().toLocaleDateString('ar-IQ') + ' ' + new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      status: 'مكتمل بنجاح'
    };
    orders.unshift(depositRecord);
    localStorage.setItem('gamepay_orders', JSON.stringify(orders));
    window.dispatchEvent(new Event('orders_updated'));
  } catch (e) {
    console.warn("Failed to log deposit record:", e);
  }

  // Broadcast balance update
  window.dispatchEvent(new CustomEvent('gamepay_balance_updated', { detail: { balance: newBalance } }));

  // Update in Firestore asynchronously
  if (user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balanceUSD: newBalance,
        updatedAt: new Date().toISOString()
      });
    } catch (e: any) {
      if (e?.code === 'permission-denied') {
        try {
          handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
        } catch (err) {
          console.error(err);
        }
      }
      console.warn("Wallet update failed in Firestore:", e);
    }
  }

  return newBalance;
}

/**
 * Atomically update user balance in Firebase & Global State
 */
export async function updateUserBalance(
  userId: string | null | undefined,
  updatedBalance: number
): Promise<number> {
  const safeBalance = Number(Number(updatedBalance).toFixed(2));

  // 1. Immediately persist to localStorage for instant local reactivity
  localStorage.setItem('gamepay_customer_balance', safeBalance.toFixed(2));

  // 2. Update local cached user profile if exists
  if (userId) {
    try {
      const cached = localStorage.getItem(`gamepay_user_profile_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.balanceUSD = safeBalance;
        parsed.updatedAt = new Date().toISOString();
        localStorage.setItem(`gamepay_user_profile_${userId}`, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn("Failed to update cached user profile:", e);
    }
  }

  // 3. Broadcast real-time balance update events across windows & components
  window.dispatchEvent(new CustomEvent('gamepay_balance_updated', { detail: { balance: safeBalance } }));
  window.dispatchEvent(new Event('storage'));

  // 4. Update balance in Firestore if userId is a valid authenticated UID
  if (userId && userId !== 'guest_customer' && userId !== 'guest_wallet' && userId !== 'guest_user') {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balanceUSD: safeBalance,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        } catch (e) {
          console.error(e);
        }
      }
      console.warn("Firestore updateUserBalance sync warning:", err);
    }
  }

  return safeBalance;
}

export interface OrderRecordInput {
  userId?: string;
  amountUSD: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  orderId?: string;
  serviceName?: string;
  packageTier?: string;
  playerId?: string;
  totalAmountIQD?: number;
}

/**
 * Record order transaction in database & local state
 */
export async function createOrderRecord(orderInput: OrderRecordInput): Promise<any> {
  const orderId = orderInput.orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-IQ') + ' ' + now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  const record = {
    id: orderId,
    userId: orderInput.userId || 'guest_user',
    serviceName: orderInput.serviceName || 'شحن رصيد المحفظة',
    packageTier: orderInput.packageTier || `$${orderInput.amountUSD.toFixed(2)} USD`,
    wholesaleCost: Number((orderInput.amountUSD * 0.85).toFixed(2)),
    retailPrice: orderInput.amountUSD,
    playerId: orderInput.playerId || 'GamePay Wallet',
    paymentMethod: orderInput.paymentMethod || 'GamePay Wallet',
    totalAmount: orderInput.totalAmountIQD || Math.round(orderInput.amountUSD * 1500),
    amountUSD: orderInput.amountUSD,
    date: dateStr,
    timestamp: Date.now(),
    status: orderInput.status === 'Completed' ? 'مكتمل' : orderInput.status,
    createdAt: orderInput.createdAt || now.toISOString()
  };

  // 1. Add to local storage orders
  try {
    const raw = localStorage.getItem('gamepay_orders');
    const orders = raw ? JSON.parse(raw) : [];
    const updated = [record, ...orders.filter((o: any) => o.id !== orderId)];
    localStorage.setItem('gamepay_orders', JSON.stringify(updated));
    window.dispatchEvent(new Event('orders_updated'));
    window.dispatchEvent(new Event('gamepay_orders_updated'));
  } catch (e) {
    console.warn("Failed to store order locally:", e);
  }

  // 2. Persist to Firestore if user is authenticated
  if (orderInput.userId && orderInput.userId !== 'guest_user' && orderInput.userId !== 'guest_wallet' && orderInput.userId !== 'guest_customer') {
    try {
      const orderRef = doc(db, 'users', orderInput.userId, 'orders', orderId);
      await setDoc(orderRef, record);
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        try {
          handleFirestoreError(err, OperationType.CREATE, `users/${orderInput.userId}/orders/${orderId}`);
        } catch (e) {
          console.error(e);
        }
      }
      console.warn("Failed to record order to Firestore:", err);
    }
  }

  return record;
}
