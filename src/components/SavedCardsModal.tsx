import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Plus, ShieldCheck, Check, Trash2, Smartphone, AlertCircle, Sparkles } from 'lucide-react';
import { SavedPaymentMethod } from '../types/payment';

// Standard Luhn Algorithm check for 16-digit payment cards
function isValidLuhn(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length !== 16) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Expiration date validation (Format MM/YY, must be a future/current month date)
function isValidExpiry(expiryStr: string): boolean {
  if (!expiryStr) return false;
  const clean = String(expiryStr).trim();
  const match = clean.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);

  const now = new Date();
  const currentYear = now.getFullYear() % 100; // e.g. 26 for 2026
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) return true;
  if (year === currentYear && month >= currentMonth) return true;
  return false;
}

// Automatic BIN brand detection based on leading digits
function detectCardBrand(cleanNum: string): {
  detectedBrand: 'QiCard' | 'Visa' | 'MasterCard' | null;
  isDetected: boolean;
} {
  if (!cleanNum || cleanNum.length === 0) {
    return { detectedBrand: null, isDetected: false };
  }

  // 1. Qi BINs check:
  // Starts with 5043, 6038, 6393, 5894, 5081, 9611 or prefix matches 504, 6038, 639
  if (
    /^(5043|6038|6393|5894|5081|9611)/.test(cleanNum) ||
    /^60\d?/.test(cleanNum) ||
    /^639\d?/.test(cleanNum) ||
    /^504\d?/.test(cleanNum)
  ) {
    return { detectedBrand: 'QiCard', isDetected: true };
  }

  // 2. Visa: Starts with 4
  if (/^4/.test(cleanNum)) {
    return { detectedBrand: 'Visa', isDetected: true };
  }

  // 3. Mastercard: Starts with 51-55 or 22-27
  if (/^(5[1-5]|2[2-7])/.test(cleanNum)) {
    return { detectedBrand: 'MasterCard', isDetected: true };
  }

  return { detectedBrand: null, isDetected: false };
}

interface SavedCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onCloseAll?: () => void;
  hasBackHistory?: boolean;
  savedCards: SavedPaymentMethod[];
  onAddCard: (card: Omit<SavedPaymentMethod, 'id' | 'token'>) => void;
  onDeleteCard: (cardId: string) => void;
  onSetDefault: (cardId: string) => void;
  selectedCardId?: string;
  onSelectCard?: (cardId: string) => void;
}

// Memoized isolated card item row for instant 0ms selection & feedback
const SavedCardRow = React.memo(({
  card,
  isSelected,
  onSelectCard,
  onSetDefault,
  onDeleteCard,
  brandMeta
}: {
  card: SavedPaymentMethod;
  isSelected: boolean;
  onSelectCard: (cardId: string) => void;
  onSetDefault: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  brandMeta: {
    name: string;
    bg: string;
    text: string;
    borderColor: string;
    icon: string;
  };
}) => {
  const handleSelect = (e: React.MouseEvent | React.TouchEvent) => {
    onSelectCard(card.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onTouchStart={handleSelect}
      className={`relative overflow-hidden rounded-2xl p-4 border transition-colors cursor-pointer select-none ${
        isSelected
          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50'
          : card.isDefault 
          ? 'border-amber-500/60 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 shadow-lg shadow-amber-500/5' 
          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-8 rounded-lg bg-gradient-to-br ${brandMeta.bg} border ${brandMeta.borderColor} flex items-center justify-center text-sm shadow-inner`}>
            {brandMeta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{brandMeta.name}</span>
              {card.isDefault && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  افتراضية
                </span>
              )}
              {isSelected && !card.isDefault && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  محددة
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono tracking-wider">
              •••• •••• •••• {card.last4}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          {!card.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(card.id)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              تعيين كافتراضية
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteCard(card.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            title="حذف البطاقة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
        <span>الاسم: <strong className="text-slate-200">{card.holderName || 'مالك البطاقة'}</strong></span>
        <span>تنتهي في: <strong className="text-slate-200 font-mono">{card.expiry}</strong></span>
      </div>
    </div>
  );
});

export default function SavedCardsModal({
  isOpen,
  onClose,
  onBack,
  onCloseAll,
  hasBackHistory = false,
  savedCards,
  onAddCard,
  onDeleteCard,
  onSetDefault,
  selectedCardId,
  onSelectCard
}: SavedCardsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [brand, setBrand] = useState<'QiCard' | 'Visa' | 'MasterCard' | 'ZainCash'>('QiCard');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [cardTouched, setCardTouched] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [error, setError] = useState('');
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Synchronous optimistic active card ID for immediate UI highlight (0ms delay)
  const [activeCardId, setActiveCardId] = useState<string>(
    () => selectedCardId || savedCards.find(c => c.isDefault)?.id || savedCards[0]?.id || ''
  );

  const handleSelectCard = useCallback((cardId: string) => {
    setActiveCardId(cardId);
    if (onSelectCard) {
      onSelectCard(cardId);
    }
  }, [onSelectCard]);

  if (!isOpen) return null;

  const cleanNum = cardNumber.replace(/\D/g, '');
  const { detectedBrand, isDetected: isAutoDetected } = detectCardBrand(cleanNum);

  // Validation states
  const isCardLengthValid = cleanNum.length === 16;
  const isLuhnValid = isValidLuhn(cleanNum);
  const isCardValid = isCardLengthValid && isLuhnValid;
  const isExpiryValid = isValidExpiry(expiry);

  // Error condition for card number
  const hasCardNumberError = (cardTouched || cleanNum.length === 16) && cleanNum.length > 0 && !isCardValid;
  const hasExpiryError = (expiryTouched || expiry.length === 5) && expiry.length > 0 && !isExpiryValid;

  // All validation rules must pass to enable save button
  const isFormValid = isCardValid && isExpiryValid;

  // Handle Card Number typing & Auto BIN detection
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = rawDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setError('');

    const detection = detectCardBrand(rawDigits);
    if (detection.isDetected && detection.detectedBrand) {
      setBrand(detection.detectedBrand);
    }
  };

  // Handle Expiration date formatting
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setExpiry(raw);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCardTouched(true);
    setExpiryTouched(true);

    if (!isCardValid) {
      setError('رقم البطاقة غير صحيح أو غير مكتمل.');
      return;
    }
    if (!isExpiryValid) {
      setError('تاريخ الانتهاء غير صحيح أو منتهي الصلاحية.');
      return;
    }

    setIsTokenizing(true);
    setError('');

    setTimeout(() => {
      onAddCard({
        brand,
        last4: cleanNum.slice(-4),
        expiry,
        isDefault,
        holderName: cardHolder || (brand === 'QiCard' ? 'بطاقة كي كارد الائتمانية' : 'بطاقة مصرفية معتمدة')
      });
      setIsTokenizing(false);
      setShowAddForm(false);
      setCardNumber('');
      setExpiry('');
      setCardHolder('');
      setCardTouched(false);
      setExpiryTouched(false);
    }, 600);
  };

  // Quick preset loader for hassle-free testing
  const handleQuickPreset = (presetType: 'Visa' | 'MasterCard' | 'QiCard') => {
    if (presetType === 'Visa') {
      setCardNumber('4242 4242 4242 4242');
      setBrand('Visa');
    } else if (presetType === 'MasterCard') {
      setCardNumber('5500 0000 0000 0004');
      setBrand('MasterCard');
    } else {
      setCardNumber('5043 0000 0000 0008');
      setBrand('QiCard');
    }
    setExpiry('12/28');
    setCardHolder(presetType === 'QiCard' ? 'حيدر فؤاد (كي كارد)' : 'حيدر فؤاد');
    setCardTouched(false);
    setExpiryTouched(false);
    setError('');
  };

  const getBrandBadge = (brandName: string) => {
    switch (brandName) {
      case 'QiCard':
        return {
          name: 'Qi Card (كي كارد)',
          bg: 'from-amber-600 to-amber-900',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/40',
          icon: '💳'
        };
      case 'Visa':
        return {
          name: 'Visa Card',
          bg: 'from-blue-700 to-indigo-950',
          textColor: 'text-blue-300',
          borderColor: 'border-blue-500/40',
          icon: '💳'
        };
      case 'MasterCard':
        return {
          name: 'Mastercard',
          bg: 'from-orange-700 to-red-950',
          textColor: 'text-orange-300',
          borderColor: 'border-orange-500/40',
          icon: '💳'
        };
      case 'ZainCash':
        return {
          name: 'زين كاش (محفظة رقمية)',
          bg: 'from-emerald-700 to-teal-950',
          textColor: 'text-emerald-300',
          borderColor: 'border-emerald-500/40',
          icon: '📱'
        };
      default:
        return {
          name: brandName,
          bg: 'from-slate-800 to-slate-900',
          textColor: 'text-slate-300',
          borderColor: 'border-slate-700',
          icon: '💳'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" dir="rtl">
      {/* Outer overlay/backdrop: Clicking backdrop exits completely */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
        onClick={() => {
          if (onCloseAll) {
            onCloseAll();
          } else {
            onClose();
          }
        }} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0c101d] border border-slate-800 rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">بطاقاتي ووسائل الدفع المسجلة</h3>
              <p className="text-[11px] text-slate-400 font-mono">PCI-DSS Tokenized Hybrid Payment Architecture</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                onClose();
              }
            }} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#070a13] space-y-4">
          
          {/* PCI DSS Notice */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-400 block mb-0.5">معايير أمان مصرفية مشفرة (PCI-DSS)</span>
              <span>لا نقوم بحفظ أرقام البطاقات الحساسة أو رموز CVV. تتم معالجة البطاقات عبر رموز مشفرة (Tokens) آمنة ومحمية بالكامل.</span>
            </div>
          </div>

          {/* Cards List */}
          {!showAddForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">البطاقات والمحافظ المحفوظة ({savedCards.length})</span>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة بطاقة جديدة</span>
                </button>
              </div>

              {savedCards.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                  <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-slate-300 mb-1">لا توجد بطاقات محفوظة حالياً</p>
                  <p className="text-xs text-slate-500 mb-4">احفظ بطاقة كي كارد أو فيزا/ماستر كارد لعمليات شراء وشحن فورية بنقرة واحدة.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-xs rounded-xl hover:opacity-95 shadow-md"
                  >
                    + إضافة بطاقتك الأولى
                  </button>
                </div>
              ) : (
                savedCards.map(card => (
                  <SavedCardRow
                    key={card.id}
                    card={card}
                    isSelected={activeCardId === card.id}
                    onSelectCard={handleSelectCard}
                    onSetDefault={onSetDefault}
                    onDeleteCard={onDeleteCard}
                    brandMeta={getBrandBadge(card.brand)}
                  />
                ))
              )}
            </div>
          )}

          {/* Add New Card Form */}
          {showAddForm && (
            <form onSubmit={handleSave} className="space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>تسجيل بطاقة دفع جديدة (Tokenized)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Brand Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-slate-400 font-medium">نوع البطاقة / الوسيلة</label>
                  {isAutoDetected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" />
                      <span>تم التعرف التلقائي ({brand === 'QiCard' ? 'Qi Card' : brand === 'Visa' ? 'Visa' : 'Mastercard'})</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'QiCard', label: 'Qi Card (كي كارد)' },
                    { id: 'Visa', label: 'Visa Card' },
                    { id: 'MasterCard', label: 'Mastercard' },
                  ].map(b => (
                    <button
                      type="button"
                      key={b.id}
                      disabled={isAutoDetected}
                      onClick={() => setBrand(b.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                        isAutoDetected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      } ${
                        brand === b.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-400 shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                {isAutoDetected && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    تم قفل التحديد يدوياً لاكتشاف بادئة البطاقة المعتمدة (BIN Prefix).
                  </p>
                )}
              </div>

              {/* Card Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400 font-medium">رقم البطاقة (16 رقماً)</label>
                  {isCardValid && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>رقم بطاقة صالح ومطابق لخوارزمية Luhn</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="xxxx xxxx xxxx 4210"
                  maxLength={19}
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  onBlur={() => setCardTouched(true)}
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-colors ${
                    hasCardNumberError
                      ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30'
                      : isCardValid
                      ? 'border-emerald-500/60 focus:border-emerald-500 ring-1 ring-emerald-500/20'
                      : 'border-slate-800 focus:border-amber-500'
                  }`}
                  dir="ltr"
                  required
                />
                {hasCardNumberError && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>رقم البطاقة غير صحيح أو غير مكتمل.</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Expiry */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-slate-400 font-medium">تاريخ الانتهاء</label>
                    {isExpiryValid && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiry}
                    onChange={handleExpiryChange}
                    onBlur={() => setExpiryTouched(true)}
                    className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none text-center transition-colors ${
                      hasExpiryError
                        ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30'
                        : isExpiryValid
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-amber-500'
                    }`}
                    dir="ltr"
                    required
                  />
                  {hasExpiryError && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>تاريخ غير صالح أو منتهي الصلاحية.</span>
                    </p>
                  )}
                </div>

                {/* Holder Name */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">الاسم على البطاقة</label>
                  <input
                    type="text"
                    placeholder="مثال: حيدر فؤاد"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Mock Card Presets for Testing */}
              <div className="pt-2 border-t border-slate-800/70">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>بطاقات تجريبية معتمدة لاختبار التحقق السريع:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('Visa')}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all cursor-pointer"
                  >
                    Visa (4242..)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('MasterCard')}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 transition-all cursor-pointer"
                  >
                    Mastercard (5500..)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('QiCard')}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                  >
                    Qi Card (5043..)
                  </button>
                </div>
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300">تعيين هذه البطاقة كوسيلة الدفع التلقائية للمشتريات</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isTokenizing}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[30%]"
              >
                {isTokenizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>جارِ التشفير الآمن وحفظ البطاقة...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>حفظ البطاقة</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
