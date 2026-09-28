import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Wallet, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, CreditCard } from 'lucide-react';
import { SavedPaymentMethod } from '../types/payment';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onCloseAll?: () => void;
  hasBackHistory?: boolean;
  onManageCards?: () => void;
  currentBalance: number;
  savedCards: SavedPaymentMethod[];
  onConfirmDeposit: (amountUSD: number, method: string) => Promise<void> | void;
  user?: any;
}

// Memoized isolated card option row to guarantee instant synchronous 0ms response
const SelectableCardOption = React.memo(({
  id,
  isSelected,
  onSelect,
  disabled,
  title,
  subtext,
  badge,
  badgeColor,
  icon,
  tokenized
}: {
  id: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
  title: string;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  tokenized?: boolean;
}) => {
  const handleSelect = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    onSelect(id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onTouchStart={handleSelect}
      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors text-right cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isSelected
          ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm ring-2 ring-amber-500/50'
          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white truncate">{title}</span>
            {badge && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeColor || 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                {badge}
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
      {tokenized && (
        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">Tokenized</span>
      )}
    </div>
  );
});

export default function DepositModal({
  isOpen,
  onClose,
  onBack,
  onCloseAll,
  hasBackHistory = false,
  onManageCards,
  currentBalance,
  savedCards,
  onConfirmDeposit,
  user
}: DepositModalProps) {
  const [amount, setAmount] = useState<number>(50);
  const [selectedCardId, setSelectedCardId] = useState<string>(
    () => savedCards.find(c => c.isDefault)?.id || savedCards[0]?.id || 'QI_CARD'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous selection callback with zero artificial delay
  const handleSelectCard = useCallback((id: string) => {
    setSelectedCardId(id);
    setErrorMessage(null);
  }, []);

  // Sync default card when savedCards changes
  useEffect(() => {
    if (savedCards.length > 0 && selectedCardId === 'QI_CARD') {
      const defaultCard = savedCards.find(c => c.isDefault) || savedCards[0];
      if (defaultCard) {
        setSelectedCardId(defaultCard.id);
      }
    }
  }, [savedCards]);

  // Safety timer ref to prevent any potential infinite hang
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount or close
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset form helper
  const resetDepositForm = () => {
    setAmount(50);
    setErrorMessage(null);
    setIsProcessing(false);
    setIsSuccess(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  if (!isOpen) return null;

  const quickAmounts = [20, 50, 100, 200, 500];

  const handleDepositSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validation
    if (!amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      setErrorMessage("يرجى تحديد مبلغ شحن صحيح");
      return;
    }

    if (!selectedCardId) {
      setErrorMessage("يرجى اختيار وسيلة دفع صحيحة");
      return;
    }

    // 2. Set Loading State
    setIsProcessing(true);
    setErrorMessage(null);

    // 3. Simulated Offline Gateway Response
    setTimeout(() => {
      // ALWAYS STOP SPINNER FIRST
      setIsProcessing(false);

      // CRITICAL: DO NOT MUTATE USER BALANCE AT ALL
      // Display error message explaining gateway is not connected
      setErrorMessage("عذراً، بوابة الدفع غير مكتملة الربط حالياً. لم يتم خصم أي مبلغ ولم يتغير رصيدك.");
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity" dir="rtl">
      {/* Outer overlay/backdrop: Clicking backdrop exits completely */}
      <div 
        className="absolute inset-0" 
        onClick={() => {
          if (!isProcessing) {
            resetDepositForm();
            if (onCloseAll) {
              onCloseAll();
            } else {
              onClose();
            }
          }
        }} 
      />
      
      <div
        className="relative z-[101] w-full max-w-lg max-h-[88vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl opacity-100 visible overflow-hidden text-right"
      >
        {/* Fixed Header (Never scrolls or gets cut off) */}
        <div className="shrink-0 flex items-center justify-between p-4 bg-slate-900/95 border-b border-slate-800/80 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">إيداع رصيد في محفظتك الإلكترونية</h3>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0">
                  محفظة فورية
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                الرصيد المتاح: <span className="font-mono font-bold text-emerald-400">${currentBalance.toFixed(2)} USD</span>
              </p>
            </div>
          </div>
          <button 
            disabled={isProcessing}
            onClick={() => {
              resetDepositForm();
              if (onBack) {
                onBack();
              } else {
                onClose();
              }
            }} 
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Footer */}
        {isSuccess ? (
          <div className="flex-1 overflow-y-auto p-6 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">تم شحن المحفظة بنجاح! 💳</h4>
            <p className="text-xs text-slate-300">
              تمت إضافة <strong className="text-emerald-400 font-mono font-bold">${amount} USD</strong> إلى رصيدك.
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              الرصيد الجديد: ${(currentBalance + amount).toFixed(2)} USD
            </p>
            <button
              onClick={() => {
                resetDepositForm();
                onClose();
              }}
              className="mt-2 py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              تم
            </button>
          </div>
        ) : (
          <form onSubmit={handleDepositSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Scrollable Content Body (Independent Internal Scroll) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              
              {/* Internal Wallet Destination Info Banner */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex items-start gap-2 text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-white">محفظة GamePay الداخلية:</strong> يتم حفظ الرصيد المشحون بأمان داخل محفظتك الرقمية لاستخدامه فوراً في إتمام طلبات الألعاب والبطاقات وبأسرع وقت.
                </span>
              </div>

              {/* Error Alert (smoothly pushes down without expanding modal height) */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Quick Select Amounts */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">اختر المبلغ للشحن (USD)</label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map(val => (
                    <button
                      type="button"
                      key={val}
                      disabled={isProcessing}
                      onClick={() => {
                        setAmount(val);
                        setErrorMessage(null);
                      }}
                      className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                        amount === val
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">أو أدخل مبلغ مخصص ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    min="5"
                    max="5000"
                    disabled={isProcessing}
                    value={amount || ''}
                    onChange={(e) => {
                      setAmount(parseFloat(e.target.value) || 0);
                      setErrorMessage(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-right pl-8 disabled:opacity-50"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">يعادل بالدينار العراقي: ~{((amount || 0) * 1500).toLocaleString()} د.ع</span>
              </div>

              {/* Payment Methods Selection: Two Distinct Visual Sections */}
              <div className="space-y-4">
                {/* SECTION 1: SAVED CARDS (Rendered only if user has saved cards) */}
                {savedCards && savedCards.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">💳</span>
                        <h4 className="text-xs font-bold text-amber-300">
                          بطاقاتك المحفوظة (دفع سريع بنقرة واحدة)
                        </h4>
                      </div>
                      {onManageCards && (
                        <button
                          type="button"
                          onClick={onManageCards}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          (إدارة البطاقات)
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {savedCards.map(card => (
                        <SelectableCardOption
                          key={card.id}
                          id={card.id}
                          isSelected={selectedCardId === card.id}
                          onSelect={handleSelectCard}
                          disabled={isProcessing}
                          title={`${card.brand} (•••• ${card.last4})`}
                          subtext="جاهزة للشحن المباشر"
                          badge={card.isDefault ? 'افتراضية' : undefined}
                          badgeColor="bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          icon={<CreditCard className="w-4 h-4 text-amber-400" />}
                          tokenized={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: NEW PAYMENT GATEWAYS */}
                <div className={`space-y-2 ${savedCards && savedCards.length > 0 ? 'pt-3 border-t border-slate-800' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🌐</span>
                      <h4 className="text-xs font-bold text-slate-300">
                        وسائل دفع أخرى / بطاقة جديدة
                      </h4>
                    </div>
                    {(!savedCards || savedCards.length === 0) && onManageCards && (
                      <button
                        type="button"
                        onClick={onManageCards}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        (إدارة البطاقات)
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Option 1: بطاقة كي كارد جديدة (دفع مباشر) */}
                    <SelectableCardOption
                      id="QI_CARD"
                      isSelected={selectedCardId === 'QI_CARD'}
                      onSelect={handleSelectCard}
                      disabled={isProcessing}
                      title="بطاقة كي كارد جديدة (دفع مباشر)"
                      badge="فوري 100%"
                      badgeColor="bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      icon={<span className="text-base">🟡</span>}
                    />

                    {/* Option 2: محفظة زين كاش (ZainCash) */}
                    <SelectableCardOption
                      id="ZAIN_CASH"
                      isSelected={selectedCardId === 'ZAIN_CASH'}
                      onSelect={handleSelectCard}
                      disabled={isProcessing}
                      title="محفظة زين كاش (ZainCash)"
                      badge="فوري"
                      badgeColor="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      icon={<span className="text-base">📱</span>}
                    />

                    {/* Option 3: بطاقة فيزا / ماستركارد جديدة */}
                    <SelectableCardOption
                      id="MASTERCARD_VISA"
                      isSelected={selectedCardId === 'MASTERCARD_VISA'}
                      onSelect={handleSelectCard}
                      disabled={isProcessing}
                      title="بطاقة فيزا / ماستركارد جديدة"
                      badge="آمن ودولي"
                      badgeColor="bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      icon={<CreditCard className="w-4 h-4 text-blue-400" />}
                    />

                    {/* Option 4: سويتش إلكترونيك (Switch Iraq) */}
                    <SelectableCardOption
                      id="SWITCH_CARD"
                      isSelected={selectedCardId === 'SWITCH_CARD'}
                      onSelect={handleSelectCard}
                      disabled={isProcessing}
                      title="سويتش إلكترونيك (Switch Iraq)"
                      badge="محلي"
                      badgeColor="bg-purple-500/15 text-purple-400 border border-purple-500/30"
                      icon={<CreditCard className="w-4 h-4 text-purple-400" />}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Action Button (Always visible at bottom, shrink-0) */}
            <div className="shrink-0 p-4 bg-slate-900/95 border-t border-slate-800/80 space-y-2">
              <button
                type="submit"
                disabled={isProcessing || !amount || amount <= 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>جارِ معالجة الإيداع بنكياً...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد شحن ${amount || 0} USD الآن</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">معاملة مشفرة ومؤمنة بالكامل عبر بوابات الدفع الوطنية والدولية</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
