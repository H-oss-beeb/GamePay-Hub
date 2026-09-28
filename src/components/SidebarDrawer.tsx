import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, History, HelpCircle, FileText, Shield, HeadphonesIcon, 
  LogOut, ChevronDown, CheckCircle2, Download, ShieldCheck, 
  Flame, Star, Zap, Receipt, CreditCard, Bell, Settings, Plus, Wallet,
  ShoppingBag, Eye, Calendar, Copy, Check, ArrowDownLeft, ArrowUpRight, ArrowRight
} from 'lucide-react';
import type { Page } from '../App';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { downloadPDFReceipt } from '../utils/pdfGenerator';
import { syncUserProfile, addSavedCard, depositWalletBalance, purgeUserStateAndStorage } from '../utils/paymentSync';
import { SavedPaymentMethod, UserProfileRecord } from '../types/payment';
import { useApp } from '../context/AppContext';
import SavedCardsModal from './SavedCardsModal';
import DepositModal from './DepositModal';
import AccountSecurityModal from './AccountSecurityModal';
import NotificationsCenterModal from './NotificationsCenterModal';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onSelectFilter?: (filterType: 'DEALS' | 'FAVORITES' | 'TOP_SELLERS' | 'ALL') => void;
  onSelectCategory?: (category: string) => void;
  onExitCart?: () => void;
}

export const ADMIN_EMAIL = 'haiderfoad@gmail.com';

export default function SidebarDrawer({ 
  isOpen, 
  onClose, 
  onNavigate,
  onSelectFilter,
  onSelectCategory,
  onExitCart
}: SidebarDrawerProps) {
  const { addToast } = useApp();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Modal Navigation Stack & History Management
  type ModalType = 
    | 'NONE' 
    | 'HISTORY' 
    | 'TRANSACTIONS' 
    | 'FAQ' 
    | 'TERMS' 
    | 'PRIVACY' 
    | 'SAVED_CARDS' 
    | 'DEPOSIT' 
    | 'ACCOUNT_SECURITY' 
    | 'NOTIFICATIONS' 
    | 'WALLET';

  const [modalStack, setModalStack] = useState<ModalType[]>([]);
  const activeModal: ModalType = modalStack.length > 0 ? modalStack[modalStack.length - 1] : 'NONE';

  const pushModal = useCallback((modal: ModalType) => {
    setModalStack(prev => {
      if (prev[prev.length - 1] === modal) return prev;
      return [...prev, modal];
    });
  }, []);

  const popModal = useCallback(() => {
    setModalStack(prev => (prev.length > 0 ? prev.slice(0, -1) : []));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalStack([]);
    setSelectedTransactionDetail(null);
  }, []);

  const setActiveModal = useCallback((modal: ModalType) => {
    if (onExitCart) {
      onExitCart();
    }
    if (modal === 'NONE') {
      closeAllModals();
    } else {
      pushModal(modal);
      onClose();
    }
  }, [closeAllModals, pushModal, onExitCart, onClose]);
  
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletStatementTab, setWalletStatementTab] = useState<'DEPOSITS' | 'PURCHASES'>('DEPOSITS');
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [balance, setBalance] = useState<number>(0);

  // Sync orders from localStorage ONLY if user is authenticated
  useEffect(() => {
    if (!user || !user.email) {
      setOrders([]);
      return;
    }

    const syncOrders = () => {
      try {
        const raw = localStorage.getItem('gamepay_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      } catch (e) {
        console.error("Error reading orders:", e);
        setOrders([]);
      }
    };
  
    syncOrders();
    window.addEventListener('orders_updated', syncOrders);
    window.addEventListener('gamepay_orders_updated', syncOrders);
    return () => {
      window.removeEventListener('orders_updated', syncOrders);
      window.removeEventListener('gamepay_orders_updated', syncOrders);
    };
  }, [user]);

  // Monitor balance events ONLY if user is authenticated
  useEffect(() => {
    const handleBalanceEvent = (e: any) => {
      if (!user || !user.email) {
        setBalance(0);
        return;
      }
      if (e.detail && typeof e.detail.balance === 'number') {
        setBalance(e.detail.balance);
      }
    };
    window.addEventListener('gamepay_balance_updated', handleBalanceEvent);
    return () => window.removeEventListener('gamepay_balance_updated', handleBalanceEvent);
  }, [user]);

  // Monitor Auth state & determine Role (admin vs user) & sync Firebase Profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Force an immediate re-evaluation and reset of admin state before setting new user object
      setUserRole('user');

      if (currentUser && currentUser.email) {
        const email = String(currentUser.email).toLowerCase().trim();
        const isAdminUser = email === (ADMIN_EMAIL || '').toLowerCase().trim();

        setUser(currentUser);
        setUserRole(isAdminUser ? 'admin' : 'user');

        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
          if (typeof profile.balanceUSD === 'number') {
            setBalance(profile.balanceUSD);
          }
          if (Array.isArray(profile.savedPaymentMethods)) {
            setSavedCards(profile.savedPaymentMethods);
          }
        } catch (err) {
          console.warn("User profile sync fallback:", err);
        }

        // Fetch user orders only for authenticated user
        try {
          const raw = localStorage.getItem('gamepay_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setOrders(parsed);
            }
          }
        } catch (e) {}
      } else {
        // GUEST / LOGGED OUT: strictly empty & zero
        setUser(null);
        setUserProfile(null);
        setUserRole('user');
        setBalance(0);
        setSavedCards([]);
        setOrders([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Modal & Drawer scroll lock + Escape key listener
  useEffect(() => {
    if (isOpen || activeModal !== 'NONE') {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (modalStack.length > 1) {
            popModal();
          } else if (activeModal !== 'NONE') {
            closeAllModals();
          } else if (isOpen) {
            onClose();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, activeModal, modalStack.length, popModal, closeAllModals, onClose]);

  const isGuest = !user || !user.email;

  const handleProtectedAction = async (action: () => void) => {
    if (isGuest) {
      addToast({
        message: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة',
        type: 'info'
      });
      try {
        const u = await signInWithGoogle();
        if (u) {
          addToast({ message: 'مرحباً بك 👋', type: 'success' }, { duration: 2000 });
          action();
        }
      } catch (err: any) {
        if (
          err?.code !== 'auth/popup-closed-by-user' &&
          err?.code !== 'auth/cancelled-popup-request' &&
          !err?.message?.includes('popup-closed-by-user')
        ) {
          console.warn("Sign-in notice:", err);
        }
      }
      return;
    }
    action();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out", error);
    }
    // 1. Explicitly reset all user-related state
    setUser(null);
    setUserProfile(null);
    setUserRole('user');
    setBalance(0);
    setOrders([]);
    setSavedCards([]);
    setSelectedTransactionDetail(null);
    setIsProfileDropdownOpen(false);

    // 2. Clear persistent storage
    purgeUserStateAndStorage();

    // 3. Close open modals
    closeAllModals();

    // Silent and seamless logout without technical toast
  };

  const handleAuthAction = async () => {
    try {
      if (user) {
        await handleLogout();
      } else {
        const u = await signInWithGoogle();
        if (u) {
          addToast({ message: 'مرحباً بك 👋', type: 'success' }, { duration: 2000 });
        }
      }
    } catch (error: any) {
      if (
        error?.code !== 'auth/popup-closed-by-user' &&
        error?.code !== 'auth/cancelled-popup-request' &&
        !error?.message?.includes('popup-closed-by-user')
      ) {
        console.warn("Auth action notice:", error);
      }
    }
  };

  const handleDealsClick = () => {
    onClose();
    if (onExitCart) onExitCart();
    if (onSelectFilter) {
      onSelectFilter('DEALS');
    }
    window.dispatchEvent(new CustomEvent('gamepay_filter_trigger', { detail: { filter: 'DEALS' } }));
  };

  const handleFavoritesClick = () => {
    onClose();
    if (onExitCart) onExitCart();
    if (onSelectFilter) {
      onSelectFilter('FAVORITES');
    }
    window.dispatchEvent(new CustomEvent('gamepay_filter_trigger', { detail: { filter: 'FAVORITES' } }));
  };

  const handleTopSellersClick = () => {
    onClose();
    if (onExitCart) onExitCart();
    if (onSelectFilter) {
      onSelectFilter('TOP_SELLERS');
    }
    window.dispatchEvent(new CustomEvent('gamepay_filter_trigger', { detail: { filter: 'TOP_SELLERS' } }));
  };

  const handleCategoryClick = (category: string) => {
    onClose();
    if (onExitCart) onExitCart();
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  const handleAddCard = async (newCardData: Omit<SavedPaymentMethod, 'id' | 'token'>) => {
    if (user) {
      const added = await addSavedCard(user, newCardData);
      setSavedCards(prev => {
        const next = newCardData.isDefault ? prev.map(c => ({ ...c, isDefault: false })) : [...prev];
        return [...next, added];
      });
    } else {
      const added: SavedPaymentMethod = {
        ...newCardData,
        id: `card_tok_${Date.now()}`,
        token: `GATEWAY_TOKEN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      };
      setSavedCards(prev => {
        const next = newCardData.isDefault ? prev.map(c => ({ ...c, isDefault: false })) : [...prev];
        return [...next, added];
      });
    }
  };

  const handleDeleteCard = (cardId: string) => {
    setSavedCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleSetDefaultCard = (cardId: string) => {
    setSavedCards(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === cardId
    })));
  };

  const handleConfirmDeposit = async (amountUSD: number, method: string) => {
    const updated = await depositWalletBalance(user, amountUSD, method, balance);
    setBalance(updated);
  };

  const FAQS = [
    { q: "كم يستغرق وصول الشحن إلى الحساب؟", a: "الشحن فوري وآلي بنسبة 100% ويصل إلى حسابك أو يظهر كودك الرقمي خلال ثوانٍ معدودة من إتمام الدفع." },
    { q: "ماذا أفعل إذا أدخلت معرف اللاعب (ID) بشكل خاطئ؟", a: "يرجى التواصل فوراً مع الدعم الفني المباشر عبر تيليجرام أو واتساب قبل إتمام التوريد من المزود." },
    { q: "ما هي وسائل الدفع المحلية والعالمية المتاحة؟", a: "ندعم زين كاش (ZainCash)، كي كارد / سويتش (Qi Card)، بالإضافة إلى بطاقات فيزا وماستر كارد العالمية ورصيد المحفظة الفوري." },
    { q: "كيف أحصل على الفواتير والوصولات الرسمية؟", a: "من خلال تبويب 'سجل الطلبات والكروت'، يمكنك تحميل فاتورة معتمدة بصيغة PDF لأي طلب بنقرة واحدة." }
  ];

  const handleDownloadPDF = async (order: any) => {
    await downloadPDFReceipt(order);
  };

  // Memoized unified dual ledger with progressive snapshot balance tracking
  const ledgerItems = React.useMemo(() => {
    let sourceList: any[] = [];
    if (orders && orders.length > 0) {
      sourceList = [...orders];
    } else {
      // Default baseline realistic records matching user specifications if orders empty
      sourceList = [
        {
          id: 'ORD-84920',
          serviceName: 'PUBG Mobile',
          packageTier: '660 UC شحن فوري',
          usdAmount: 23.00,
          totalAmount: 34500,
          paymentMethod: 'GamePay Wallet',
          date: '2026/09/21 - 01:04 ص',
          status: 'مكتمل ومؤكد',
          type: 'PURCHASE',
          isDeposit: false,
          playerId: '5192847102'
        },
        {
          id: 'DEP-50281',
          serviceName: 'شحن رصيد المحفظة الإلكترونية',
          packageTier: 'إيداع نقدي فوري ($50.00 USD)',
          usdAmount: 50.00,
          totalAmount: 75000,
          paymentMethod: 'ZainCash',
          date: '2026/09/21 - 01:04 ص',
          status: 'مكتمل ومؤكد',
          type: 'DEPOSIT',
          isDeposit: true,
          playerId: 'محفظة GamePay'
        },
        {
          id: 'DEP-INIT-01',
          serviceName: 'رصيد محفظة افتتاحي (Opening Deposit)',
          packageTier: 'إيداع تأسيسي ($45.00 USD)',
          usdAmount: 45.00,
          totalAmount: 67500,
          paymentMethod: 'كي كارد / مصرف الرافدين (Qi Card)',
          date: '2026/09/20 - 10:30 م',
          status: 'مكتمل ومؤكد',
          type: 'DEPOSIT',
          isDeposit: true,
          playerId: 'محفظة GamePay'
        }
      ];
    }

    // Calculate snapshot balance backwards from current balance
    let runningBalance = balance;
    return sourceList.map((item, idx) => {
      const isDeposit = item.type === 'DEPOSIT' || 
        (item.id && String(item.id).startsWith('DEP-')) || 
        (item.serviceName && (item.serviceName.includes('شحن') || item.serviceName.includes('إيداع'))) ||
        Boolean(item.isDeposit);

      const type: 'DEPOSIT' | 'PURCHASE' = isDeposit ? 'DEPOSIT' : 'PURCHASE';

      let usdAmount = 0;
      if (typeof item.usdAmount === 'number' && !isNaN(item.usdAmount)) {
        usdAmount = item.usdAmount;
      } else if (typeof item.retailPrice === 'number' && !isNaN(item.retailPrice)) {
        usdAmount = item.retailPrice;
      } else if (typeof item.totalAmount === 'number' && !isNaN(item.totalAmount)) {
        usdAmount = item.totalAmount >= 1000 ? Number((item.totalAmount / 1500).toFixed(2)) : item.totalAmount;
      } else {
        usdAmount = isDeposit ? 50.00 : 23.00;
      }

      let iqdAmount = 0;
      if (typeof item.totalAmount === 'number' && item.totalAmount >= 1000) {
        iqdAmount = Math.round(item.totalAmount);
      } else if (typeof item.totalAmountIQD === 'number') {
        iqdAmount = Math.round(item.totalAmountIQD);
      } else {
        iqdAmount = Math.round(usdAmount * 1500);
      }

      const snapshot = typeof item.snapshotBalance === 'number' 
        ? item.snapshotBalance 
        : runningBalance;

      // Update runningBalance backwards for older transaction items in statement
      if (isDeposit) {
        runningBalance = Math.max(0, Number((runningBalance - usdAmount).toFixed(2)));
      } else {
        runningBalance = Number((runningBalance + usdAmount).toFixed(2));
      }

      const formattedDate = item.date || item.createdAt || '2026/09/21 - 01:04 ص';
      const method = item.paymentMethod || (isDeposit ? 'ZainCash' : 'GamePay Wallet');

      return {
        id: item.id || `TXN-${idx + 100}`,
        type,
        isDeposit,
        serviceName: item.serviceName || (isDeposit ? 'شحن رصيد المحفظة الإلكترونية' : 'مشتريات بطاقة رقمية'),
        packageTier: item.packageTier || (isDeposit ? `إيداع نقدي ($${usdAmount.toFixed(2)} USD)` : 'باقة شحن ألعاب'),
        usdAmount,
        iqdAmount,
        snapshotBalance: snapshot,
        paymentMethod: method,
        date: formattedDate,
        status: item.status || 'مكتمل ومؤكد',
        playerId: item.playerId || 'محفظة GamePay',
        raw: {
          ...item,
          id: item.id || `TXN-${idx + 100}`,
          isDeposit,
          usdAmount,
          totalAmount: iqdAmount,
          snapshotBalance: snapshot,
          date: formattedDate,
          paymentMethod: method
        }
      };
    });
  }, [orders, balance]);

  const depositItems = React.useMemo(() => ledgerItems.filter(item => item.isDeposit), [ledgerItems]);
  const purchaseItems = React.useMemo(() => ledgerItems.filter(item => !item.isDeposit), [ledgerItems]);

  const displayedLedgerItems = walletStatementTab === 'DEPOSITS' 
    ? depositItems 
    : purchaseItems;

  const handleCopyId = (idStr: string) => {
    navigator.clipboard?.writeText(idStr);
    setCopiedId(idStr);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract first name
  const userFirstName = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'المستخدم');

  // 1. STRICT ADMIN EMAIL CHECK (STRICT CASE-INSENSITIVE CHECK)
  // Define a single source of truth for Admin status:
  const isAdmin = Boolean(
    user && 
    user.email && 
    String(user.email).toLowerCase().trim() === (ADMIN_EMAIL || '').toLowerCase().trim()
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 transition-opacity"
            />

            {/* Slide-over Drawer Menu - Minimalist & Functional */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[340px] bg-[#0c101c] border-l border-slate-800/70 z-[60] flex flex-col shadow-2xl text-right font-sans select-none overflow-hidden"
              dir="rtl"
            >
              {/* 1. COMPACT USER HEADER: Avatar + First Name + VIP Badge + Dropdown Trigger + Close Button */}
              <div className="h-[68px] flex items-center justify-between px-3.5 border-b border-slate-800/60 bg-slate-900/50 shrink-0 relative">
                
                {/* Right: Account section (Logged in: clickable trigger with arrow; Guest: Login button) */}
                {user ? (
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                    className="flex items-center gap-2 min-w-0 p-1.5 -mr-1.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer group text-right"
                    title="خيارات الحساب"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center overflow-hidden">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="avatar" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0c101c] rounded-full" />
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-white truncate max-w-[105px]">
                        {userFirstName}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 leading-none shrink-0">
                        VIP
                      </span>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-200 shrink-0 ${
                          isProfileDropdownOpen ? 'rotate-180 text-amber-400' : ''
                        }`} 
                      />
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const u = await signInWithGoogle();
                          if (u) {
                            addToast({ message: 'مرحباً بك 👋', type: 'success' }, { duration: 2000 });
                          }
                        } catch (err: any) {
                          if (
                            err?.code !== 'auth/popup-closed-by-user' &&
                            err?.code !== 'auth/cancelled-popup-request' &&
                            !err?.message?.includes('popup-closed-by-user')
                          ) {
                            console.warn("Sign-in notice:", err);
                          }
                        }
                      }}
                      className="py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>تسجيل الدخول / Google</span>
                    </button>
                  </div>
                )}

                {/* Left: Close Button */}
                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    onClose();
                  }} 
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Floating Profile Dropdown Menu */}
              {isProfileDropdownOpen && user && (
                <>
                  {/* Backdrop click listener to auto-dismiss */}
                  <div 
                    className="fixed inset-0 z-[95]" 
                    onClick={() => setIsProfileDropdownOpen(false)} 
                  />

                  {/* Dropdown Container */}
                  <div 
                    className="absolute top-14 left-4 z-[100] w-52 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl space-y-1 select-none text-right font-sans"
                    dir="rtl"
                  >
                    {/* 1. ACCOUNT HEADER */}
                    <div className="text-[10px] text-slate-400 px-3 py-1.5 border-b border-white/5">
                      <div className="font-bold text-white text-xs truncate">
                        {user.displayName || userFirstName}
                      </div>
                      <div className="text-slate-400 truncate mt-0.5 font-mono" dir="ltr">
                        {user.email || ''}
                      </div>
                    </div>

                    {/* 2. SWITCH ACCOUNT BUTTON */}
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        try {
                          const u = await signInWithGoogle(true);
                          if (u) {
                            addToast({ message: 'مرحباً بك 👋', type: 'success' }, { duration: 2000 });
                          }
                        } catch (err: any) {
                          if (
                            err?.code !== 'auth/popup-closed-by-user' &&
                            err?.code !== 'auth/cancelled-popup-request' &&
                            !err?.message?.includes('popup-closed-by-user')
                          ) {
                            console.warn("Switch account notice:", err);
                          }
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🔄</span>
                        <span>تغيير الحساب</span>
                      </div>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono">Google</span>
                    </button>

                    {/* 3. LOGOUT BUTTON */}
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        await handleLogout();
                      }}
                      className="text-red-400 hover:bg-red-500/10 rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center justify-between cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚪</span>
                        <span>تسجيل الخروج</span>
                      </div>
                      <span className="text-xs text-red-400/80">↳</span>
                    </button>
                  </div>
                </>
              )}

              {/* 1. TOP WALLET CARD WIDGET: Ultra-Slim & Compact */}
              <div className="px-3 shrink-0">
                <div className="w-full p-3 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-lg relative overflow-hidden my-2">
                  {/* Subtle decorative glow */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -translate-x-4 -translate-y-4" />

                  {/* Top Row */}
                  <div className="flex items-center justify-between relative z-10 mb-2">
                    <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1">
                      <span>محفظة GamePay</span>
                      <span>💳</span>
                    </span>

                    {isGuest ? (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                        غير مسجل ⚪
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        نشطة 🟢
                      </span>
                    )}
                  </div>

                  {/* Middle Main Row (Flex Row Layout) */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="text-base font-extrabold text-emerald-400 font-mono tracking-tight" dir="ltr">
                      USD ${isGuest ? '0.00' : balance.toFixed(2)}
                    </div>

                    <button
                      onClick={() => handleProtectedAction(() => setActiveModal('DEPOSIT'))}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>شحن ⚡</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. UNIFIED NAVIGATION LIST */}
              <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
                
                {/* [قسم العروض والتسوق] */}
                <div className="text-[11px] font-semibold text-slate-500 tracking-wider px-3 pt-1 pb-1">
                  قسم العروض والتسوق
                </div>

                {/* 1. 🔥 العروض والخصومات */}
                <button
                  onClick={handleDealsClick}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🔥</span>
                    <span>العروض والخصومات</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 leading-none">
                    %
                  </span>
                </button>

                {/* 2. ⭐ المنتجات المفضلة */}
                <button
                  onClick={handleFavoritesClick}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">⭐</span>
                    <span>المنتجات المفضلة</span>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                </button>

                {/* 3. ⚡ الأكثر شعبية */}
                <button
                  onClick={handleTopSellersClick}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">⚡</span>
                    <span>الأكثر شعبية</span>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                </button>

                {/* [تصنيفات الخدمات] Category Pills */}
                <div className="text-[11px] font-semibold text-slate-500 tracking-wider px-3 pt-2 pb-1">
                  تصنيفات الخدمات
                </div>
                <div className="grid grid-cols-3 gap-1.5 px-1 pb-1">
                  <button
                    onClick={() => handleCategoryClick('GAMES')}
                    className="py-2 px-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-[11px] font-bold text-slate-200 hover:text-white flex flex-col items-center gap-1 transition-all cursor-pointer hover:border-amber-500/30"
                  >
                    <span className="text-base">🎮</span>
                    <span className="truncate">الألعاب</span>
                  </button>
                  <button
                    onClick={() => handleCategoryClick('STREAMING')}
                    className="py-2 px-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-[11px] font-bold text-slate-200 hover:text-white flex flex-col items-center gap-1 transition-all cursor-pointer hover:border-amber-500/30"
                  >
                    <span className="text-base">📺</span>
                    <span className="truncate">البث</span>
                  </button>
                  <button
                    onClick={() => handleCategoryClick('SPORTS')}
                    className="py-2 px-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-[11px] font-bold text-slate-200 hover:text-white flex flex-col items-center gap-1 transition-all cursor-pointer hover:border-amber-500/30"
                  >
                    <span className="text-base">🏆</span>
                    <span className="truncate">الرياضة</span>
                  </button>
                </div>

                {/* Divider Line */}
                <div className="border-t border-slate-800/40 my-2" />

                {/* [الحساب والعمليات] */}
                <div className="text-[11px] font-semibold text-slate-500 tracking-wider px-3 pt-1 pb-1">
                  الحساب والعمليات
                </div>

                {/* BOTTOM MENU ITEM: 📜 كشف المحفظة وسجل العمليات */}
                <button
                  onClick={() => handleProtectedAction(() => setActiveModal('WALLET'))}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-800/60 text-slate-200 text-sm font-medium transition-all group cursor-pointer border border-slate-800/70 bg-slate-900/30 mb-1"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📜</span>
                    <div className="text-right">
                      <span className="font-bold text-white block leading-snug">كشف المحفظة وسجل العمليات</span>
                      <span className="text-[10px] text-slate-400 block leading-tight">سجل الإيداعات والمشتريات</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                  </div>
                </button>

                {/* 4. 📦 سجل الطلبات والكروت */}
                <button
                  onClick={() => handleProtectedAction(() => setActiveModal('HISTORY'))}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📦</span>
                    <span>سجل الطلبات والكروت</span>
                  </div>
                  {!isGuest && orders.length > 0 ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {orders.length}
                    </span>
                  ) : (
                    <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                  )}
                </button>

                {/* 5. 🧾 كشف الحساب والعمليات */}
                <button
                  onClick={() => handleProtectedAction(() => setActiveModal('TRANSACTIONS'))}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🧾</span>
                    <span>كشف الحساب والعمليات</span>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                </button>

                {/* 6. 💳 بطاقاتي ووسائل الدفع المسجلة */}
                <button
                  onClick={() => handleProtectedAction(() => setActiveModal('SAVED_CARDS'))}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💳</span>
                    <span>بطاقاتي ووسائل الدفع المسجلة</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {isGuest ? 0 : savedCards.length}
                  </span>
                </button>

                {/* 7. ⚙️ إعدادات الحساب والأمان */}
                <button
                  onClick={() => handleProtectedAction(() => setActiveModal('ACCOUNT_SECURITY'))}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">⚙️</span>
                    <span>إعدادات الحساب والأمان</span>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                </button>

                {/* 🔐 لوحة التحكم / دخول الأدمن (Admin Portal Entry - Strictly for Primary Administrator) */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (onExitCart) onExitCart();
                      onClose();
                      onNavigate('ADMIN');
                    }}
                    className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 font-semibold text-sm transition-all group cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] my-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base p-1 rounded-lg bg-amber-500/20 border border-amber-500/40">🔐</span>
                      <div className="text-right">
                        <span className="block leading-snug">لوحة التحكم / دخول الأدمن</span>
                        <span className="text-[10px] text-amber-400/70 font-mono block">إدارة النظام والأسعار</span>
                      </div>
                    </div>
                    <span className="text-amber-400/80 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">›</span>
                  </button>
                )}

                {/* Divider Line */}
                <div className="border-t border-slate-800/40 my-2" />

                {/* [الدعم والمساعدة] */}
                <div className="text-[11px] font-semibold text-slate-500 tracking-wider px-3 pt-1 pb-1">
                  الدعم والمساعدة
                </div>

                {/* 8. 🔔 مركز الإشعارات */}
                <button
                  onClick={() => setActiveModal('NOTIFICATIONS')}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🔔</span>
                    <span>مركز الإشعارات</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                </button>

                {/* 9. 🎧 الدعم الفني المباشر */}
                <button
                  onClick={() => {
                    onClose();
                    window.open('https://wa.me/9647714783453', '_blank');
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🎧</span>
                    <span>الدعم الفني المباشر</span>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                </button>

                {/* 10. ❓ مركز المساعدة والأسئلة الشائعة */}
                <button
                  onClick={() => setActiveModal('FAQ')}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-800/50 text-slate-200 text-sm font-medium transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">❓</span>
                    <span>مركز المساعدة والأسئلة الشائعة</span>
                  </div>
                  <span className="text-slate-500 group-hover:text-slate-300 text-sm">›</span>
                </button>
              </div>

              {/* 3. FOOTER: Micro Legal Links & Engine Version */}
              <div className="p-3 border-t border-slate-800/60 bg-slate-900/40 shrink-0">
                {/* Micro legal links: "الشروط والأحكام • سياسة الخصوصية" + App Version "GamePay Engine v2.4" */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                    <button 
                      onClick={() => setActiveModal('TERMS')} 
                      className="hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      الشروط والأحكام
                    </button>
                    <span>•</span>
                    <button 
                      onClick={() => setActiveModal('PRIVACY')} 
                      className="hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      سياسة الخصوصية
                    </button>
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono mt-1 block text-center">
                    GamePay Engine v2.4
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dynamic Modals (History, Transactions, FAQ, Terms, Privacy) */}
      <AnimatePresence>
        {activeModal !== 'NONE' && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" 
              onClick={closeAllModals} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="w-full max-w-lg bg-[#0c101d] border border-slate-800 rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh] text-right"
              dir="rtl"
            >
              
              {/* MODAL 1: ORDER HISTORY & SERIAL KEYS */}
              {activeModal === 'HISTORY' && (
                <>
                  <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-sky-400" /> 
                      <span>سجل الطلبات والكروت (Order History & Serial Keys)</span>
                    </h3>
                    <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 overflow-y-auto flex-1 bg-[#070a13] space-y-4">
                    {orders.length === 0 ? (
                      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center">
                        <History className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
                        <p className="text-slate-300 font-bold text-sm mb-1">لا توجد طلبات سابقة مسجلة</p>
                        <p className="text-slate-500 text-xs">ستظهر أكواد الشحن والطلبات هنا فور إتمام أول عملية شحن ناجحة.</p>
                      </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 p-5 rounded-2xl transition-all shadow-md">
                          <div className="flex justify-between items-start mb-3 border-b border-slate-800/80 pb-3">
                            <div>
                              <h4 className="text-white font-extrabold text-base">{order.serviceName}</h4>
                              <p className="text-slate-400 text-xs mt-1 font-mono">{order.date}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {order.status || 'مكتمل بنجاح'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">معرف اللاعب / الكود:</span>
                              <span className="text-white font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{order.playerId || 'DIGITAL_CODE'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">الباقة المشتراة:</span>
                              <span className="text-amber-400 font-bold">{order.packageTier}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">وسيلة الدفع:</span>
                              <span className="text-slate-200">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-800/60 pt-1.5 font-bold">
                              <span className="text-slate-300">المبلغ المدفوع:</span>
                              <span className="text-emerald-400 font-mono text-sm">{order.totalAmount?.toLocaleString()} د.ع</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDownloadPDF(order)} 
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" /> تحميل إيصال الشراء الرقمي (PDF)
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* MODAL: WALLET DETAILS & STATEMENT (DUAL LEDGER) */}
              {(activeModal === 'WALLET' || activeModal === 'TRANSACTIONS') && (
                <>
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">كشف المحفظة وسجل العمليات</h3>
                        <p className="text-[11px] text-slate-400">سجل الإيداعات، المشتريات ومطابقة الأرصدة التراكمية</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (modalStack.length > 1) {
                          popModal();
                        } else {
                          closeAllModals();
                        }
                      }} 
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                      title="إغلاق النافذة"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#070a13] space-y-4 relative">
                    {/* Top Balance Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1420] to-slate-950 border border-slate-800 p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-400">الرصيد الصافي المتاح للخصم الفوري</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>نشط ومؤمن</span>
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3.5">
                        <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tracking-tight">${balance.toFixed(2)}</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">USD</span>
                        <span className="text-xs font-mono text-slate-500 mr-1">
                          (~{Math.round(balance * 1500).toLocaleString()} د.ع)
                        </span>
                      </div>

                      {/* Quick Navigation: Saved Cards & Deposit */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => pushModal('SAVED_CARDS')}
                          className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                          <span>البطاقات ({savedCards.length})</span>
                        </button>
                        <button
                          onClick={() => pushModal('DEPOSIT')}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>شحن المحفظة</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION TITLE */}
                    <div className="text-sm font-bold text-slate-300 mb-2 px-1 flex items-center gap-2">
                      <span>📜 سجل العمليات</span>
                    </div>

                    {/* TWO-SEGMENT FULL-WIDTH TABS (50% / 50%) */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setWalletStatementTab('DEPOSITS')}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          walletStatementTab === 'DEPOSITS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                        }`}
                      >
                        <span>⚡ عمليات الشحن (+)</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          walletStatementTab === 'DEPOSITS'
                            ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                            : 'bg-slate-800/90 text-slate-500'
                        }`}>
                          {depositItems.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setWalletStatementTab('PURCHASES')}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          walletStatementTab === 'PURCHASES'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                        }`}
                      >
                        <span>🛒 المشتريات والخصومات (-)</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          walletStatementTab === 'PURCHASES'
                            ? 'bg-rose-500/30 text-rose-300 font-bold'
                            : 'bg-slate-800/90 text-slate-500'
                        }`}>
                          {purchaseItems.length}
                        </span>
                      </button>
                    </div>

                    {/* SECTION 2 & 3: TRANSACTION CARDS OR EMPTY STATE */}
                    {displayedLedgerItems.length === 0 ? (
                      /* SECTION 3: EMPTY STATES */
                      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
                          <Receipt className="w-6 h-6 opacity-60" />
                        </div>
                        <p className="text-slate-300 font-bold text-sm">
                          لا توجد عمليات مسجلة في هذا القسم حتى الآن.
                        </p>
                        <p className="text-slate-500 text-xs max-w-xs mx-auto">
                          {walletStatementTab === 'DEPOSITS' 
                            ? 'ستظهر هنا جميع عمليات شحن المحفظة والإيداعات فور إتمامها.' 
                            : 'ستظهر هنا كافة مشترياتك وبطاقاتك وسندات الخصم المنفذة عبر المحفظة.'}
                        </p>
                      </div>
                    ) : (
                      /* SECTION 2: TRANSACTION CARDS LIST */
                      <div className="space-y-3">
                        {displayedLedgerItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 bg-slate-900/85 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl transition-all duration-200 shadow-sm space-y-2.5"
                          >
                            {/* Card Header: Service Info & Main Amount */}
                            <div className="flex items-start justify-between gap-3">
                              {/* Service Info */}
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  item.isDeposit 
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                                }`}>
                                  {item.isDeposit ? (
                                    <Zap className="w-4 h-4 fill-emerald-400/20" />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-xs font-bold text-white leading-tight truncate">
                                      {item.serviceName}
                                    </h4>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      item.isDeposit 
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    }`}>
                                      {item.isDeposit ? '⚡ إيداع معتمد' : '🛒 خصم مشتريات'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    {item.packageTier}
                                  </p>
                                  <span className="text-[10px] font-mono text-slate-500 block">
                                    معرف الحركة: #{item.id}
                                  </span>
                                </div>
                              </div>

                              {/* Main Amount */}
                              <div className="text-left shrink-0">
                                {item.isDeposit ? (
                                  <>
                                    <span className="text-sm sm:text-base font-black font-mono text-emerald-400 block tracking-tight">
                                      +${item.usdAmount.toFixed(2)} USD
                                    </span>
                                    <span className="text-[11px] font-mono text-emerald-500/70 block text-left">
                                      ~{item.iqdAmount.toLocaleString()} د.ع
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm sm:text-base font-black font-mono text-rose-400 block tracking-tight">
                                      -${item.usdAmount.toFixed(2)} USD
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-400 block text-left">
                                      ~{item.iqdAmount.toLocaleString()} د.ع
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Middle Metadata: Date/Time + Snapshot Balance + Method */}
                            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              {/* Date/Time + Snapshot Balance (directly under timestamp) */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="font-mono text-[11px]">{item.date}</span>
                                </div>
                                {/* Snapshot Balance: directly under timestamp */}
                                <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                  <span className="text-slate-500">الرصيد المتبقي:</span>
                                  <span className="font-mono font-bold text-emerald-400 text-xs">
                                    ${item.snapshotBalance.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Payment Method Badge */}
                              <div className="flex items-center gap-1.5 self-start sm:self-center">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/70">
                                  <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.paymentMethod}</span>
                                </span>
                              </div>
                            </div>

                            {/* Bottom Actions Row */}
                            <div className="pt-1 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-emerald-400 font-semibold">{item.status}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedTransactionDetail(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                                  <span>عرض التفاصيل</span>
                                </button>

                                <button
                                  onClick={() => handleDownloadPDF(item.raw || item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                                >
                                  <Download className="w-3.5 h-3.5 text-amber-400" />
                                  <span>تنزيل الفاتورة PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* OVERLAY: TRANSACTION DETAILS MODAL */}
                    {selectedTransactionDetail && (
                      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#0b101c] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right">
                          {/* Details Header */}
                          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                selectedTransactionDetail.isDeposit 
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}>
                                {selectedTransactionDetail.isDeposit ? <Zap className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-white">تفاصيل الحركة المالية</h4>
                                <p className="text-[11px] text-slate-400">سند رسمي معتمد ومؤكد بالكامل</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedTransactionDetail(null)}
                              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Details Body */}
                          <div className="p-5 space-y-4 text-xs">
                            {/* Amount Showcase Banner */}
                            <div className="text-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90">
                              <span className="text-[11px] text-slate-400 block mb-1">
                                {selectedTransactionDetail.isDeposit ? 'مبلغ الإيداع الصافي' : 'مبلغ الخصم الإجمالي'}
                              </span>
                              <strong className={`text-2xl sm:text-3xl font-black font-mono block ${
                                selectedTransactionDetail.isDeposit ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {selectedTransactionDetail.isDeposit ? '+' : '-'}${selectedTransactionDetail.usdAmount.toFixed(2)} USD
                              </strong>
                              <span className="text-xs font-mono text-slate-400 block mt-1">
                                ~{selectedTransactionDetail.iqdAmount.toLocaleString()} دينار عراقي
                              </span>
                              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                                الرصيد المتبقي بعد الحركة: <strong className="font-mono text-emerald-400">${selectedTransactionDetail.snapshotBalance.toFixed(2)}</strong>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-2 text-slate-300">
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <span className="text-slate-400 text-[11px]">معرف المعاملة:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-sky-400 text-[11px]">#{selectedTransactionDetail.id}</span>
                                  <button
                                    onClick={() => handleCopyId(selectedTransactionDetail.id)}
                                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                                    title="نسخ المعرف"
                                  >
                                    {copiedId === selectedTransactionDetail.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <span className="text-slate-400 text-[11px]">الخدمة / الباقة:</span>
                                <span className="font-bold text-white text-[11px] truncate max-w-[200px]">
                                  {selectedTransactionDetail.serviceName} - {selectedTransactionDetail.packageTier}
                                </span>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <span className="text-slate-400 text-[11px]">طريقة الدفع:</span>
                                <span className="font-medium text-slate-200 text-[11px]">{selectedTransactionDetail.paymentMethod}</span>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <span className="text-slate-400 text-[11px]">التاريخ والوقت:</span>
                                <span className="font-mono text-slate-300 text-[11px]">{selectedTransactionDetail.date}</span>
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <span className="text-slate-400 text-[11px]">الحالة:</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>{selectedTransactionDetail.status}</span>
                                </span>
                              </div>
                            </div>

                            {/* Details Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                onClick={() => handleDownloadPDF(selectedTransactionDetail.raw || selectedTransactionDetail)}
                                className="py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                              >
                                <Download className="w-4 h-4 text-amber-400" />
                                <span>تنزيل الفاتورة PDF</span>
                              </button>
                              <button
                                onClick={() => setSelectedTransactionDetail(null)}
                                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center cursor-pointer transition-all"
                              >
                                <span>إغلاق</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* MODAL 3: FAQ */}
              {activeModal === 'FAQ' && (
                <>
                  <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-purple-400" /> 
                      <span>مركز المساعدة والأسئلة الشائعة</span>
                    </h3>
                    <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-[#070a13]">
                    {FAQS.map((faq, i) => (
                      <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} 
                          className="w-full p-4 flex justify-between items-center text-right hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-sm text-slate-200">{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedFaq === i && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }} 
                              className="px-4 pb-4 text-xs text-amber-300/90 leading-relaxed font-medium border-t border-slate-800/60 pt-3"
                            >
                              {faq.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* MODAL 4: TERMS */}
              {activeModal === 'TERMS' && (
                <>
                  <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-500" /> 
                      <span>الشروط والأحكام</span>
                    </h3>
                    <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-xs leading-loose space-y-4 bg-[#070a13]">
                    <p className="font-bold text-amber-400 text-sm">أهلاً بك في منصة GamePay الإلكترونية لشحن الألعاب والخدمات الرقمية:</p>
                    <ul className="list-disc list-inside space-y-2.5 text-slate-400 marker:text-amber-500">
                      <li><strong className="text-white">مسؤولية معرف اللاعب:</strong> يتحمل المشتري كامل المسؤولية عن صحة معرف اللاعب (Player ID) المكتوب أثناء إتمام الطلب.</li>
                      <li><strong className="text-white">السلع الرقمية:</strong> البطاقات الرقمية والأكواد المنفذة غير قابلة للإلغاء أو الاسترجاع بمجرد استخراج الكود أو إرساله للخادم.</li>
                      <li><strong className="text-white">الربط الآلي للموردين:</strong> تتم معالجة وتغذية الشحنات فورياً عبر بوابات API مباشرة، مع نظام تعويض آلي في حال فشل الإرسال من المصدر.</li>
                    </ul>
                  </div>
                </>
              )}

              {/* MODAL 5: PRIVACY */}
              {activeModal === 'PRIVACY' && (
                <>
                  <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" /> 
                      <span>سياسة الخصوصية وأمان البيانات</span>
                    </h3>
                    <button onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 text-slate-300 text-xs leading-loose space-y-4 bg-[#070a13]">
                    <p className="font-bold text-emerald-400 text-sm">أمانك وسرية معاملاتك هي ركيزتنا الأساسية:</p>
                    <ul className="list-disc list-inside space-y-2.5 text-slate-400 marker:text-emerald-500">
                      <li><strong className="text-white">تشفير الدفع الهجين:</strong> معمارية متوافقة مع معايير PCI-DSS لا تحفظ تفاصيل البطاقات السرية وتعتمد نظام التشفير بالرموز (Tokenization).</li>
                      <li><strong className="text-white">حسابات المستخدمين:</strong> تسجيل الدخول بحساب Google يُستخدم فقط لحفظ وصولاتك وسجل طلباتك لتستطيع مراجعتها بأي وقت.</li>
                      <li><strong className="text-white">عدم مشاركة البيانات:</strong> نلتزم بعدم بيع أو تقديم بيانات عملائنا لأي جهات إعلانية أو طرف ثالث.</li>
                    </ul>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: SAVED CARDS & PAYMENT METHODS (PCI-DSS) */}
      <SavedCardsModal
        isOpen={activeModal === 'SAVED_CARDS'}
        onClose={popModal}
        onBack={popModal}
        onCloseAll={closeAllModals}
        hasBackHistory={modalStack.length > 1}
        savedCards={savedCards}
        onAddCard={handleAddCard}
        onDeleteCard={handleDeleteCard}
        onSetDefault={handleSetDefaultCard}
      />

      {/* MODAL 7: DEPOSIT & WALLET TOP-UP */}
      <DepositModal
        isOpen={activeModal === 'DEPOSIT'}
        onClose={popModal}
        onBack={popModal}
        onCloseAll={closeAllModals}
        hasBackHistory={modalStack.length > 1}
        onManageCards={() => pushModal('SAVED_CARDS')}
        currentBalance={balance}
        savedCards={savedCards}
        onConfirmDeposit={handleConfirmDeposit}
        user={user}
      />

      {/* MODAL 8: ACCOUNT SECURITY & SETTINGS */}
      <AccountSecurityModal
        isOpen={activeModal === 'ACCOUNT_SECURITY'}
        onClose={popModal}
        user={user}
      />

      {/* MODAL 9: NOTIFICATIONS CENTER */}
      <NotificationsCenterModal
        isOpen={activeModal === 'NOTIFICATIONS'}
        onClose={popModal}
      />
    </>
  );
}
