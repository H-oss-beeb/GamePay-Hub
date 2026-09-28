import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, CreditCard, Gamepad2, CheckCircle2, Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { saveCompletedOrder } from '../context/OrderContext';
import { downloadPDFReceipt } from '../utils/pdfGenerator';
import { updateUserBalance, createOrderRecord } from '../utils/paymentSync';

const GATEWAYS = [
  { id: 'wallet', name: 'رصيد المحفظة الفوري (GamePay Wallet)', color: 'bg-emerald-500' },
  { id: 'switch', name: 'Switch / Qi Card (كي كارد)', color: 'bg-amber-500' },
  { id: 'zaincash', name: 'Zain Cash (زين كاش)', color: 'bg-red-500' },
  { id: 'visa', name: 'Visa & Mastercard', color: 'bg-blue-600' },
];

type CheckoutStep = 'CART_REVIEW' | 'PAYMENT_SELECT' | 'PROCESSING' | 'SUCCESS';

export default function CartDrawer({ isOpen, onClose }: any) {
  const { cart, removeFromCart, clearCart } = useCart();
  const { dispatchNewOrder, addToast } = useApp();
  
  const [step, setStep] = useState<CheckoutStep>('CART_REVIEW');
  const [selectedGateway, setSelectedGateway] = useState(GATEWAYS[0].id);
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gamepay_customer_balance');
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num)) return num;
      }
    } catch (e) {}
    return 120.00;
  });

  useEffect(() => {
    const handleBalanceUpdate = (e: any) => {
      if (e.detail && typeof e.detail.balance === 'number') {
        setBalance(e.detail.balance);
      } else {
        try {
          const saved = localStorage.getItem('gamepay_customer_balance');
          if (saved) {
            const num = parseFloat(saved);
            if (!isNaN(num)) setBalance(num);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('gamepay_balance_updated', handleBalanceUpdate);
    window.addEventListener('storage', handleBalanceUpdate);
    return () => {
      window.removeEventListener('gamepay_balance_updated', handleBalanceUpdate);
      window.removeEventListener('storage', handleBalanceUpdate);
    };
  }, []);

  // Scroll lock and Escape listener
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && step !== 'PROCESSING') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'auto';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, step]);

  const totalIQD = cart.reduce((sum: number, item: any) => sum + item.package.priceIQD, 0);

  const totalUSD = cart.reduce((sum: number, item: any) => {
    if (typeof item.package.retailPrice === 'number' && item.package.retailPrice > 0) {
      return sum + item.package.retailPrice;
    }
    const match = item.package.title?.match(/\$(\d+(\.\d+)?)/);
    if (match) return sum + parseFloat(match[1]);
    return sum + (item.package.priceIQD || 1500) / 1500;
  }, 0);

  const handleCheckout = async () => {
    if (selectedGateway === 'wallet') {
      const currentBalance = Number(balance || 0);
      const price = Number(totalUSD);

      if (currentBalance < price) {
        addToast({
          title: 'فشل العملية',
          message: 'رصيد المحفظة غير كافٍ لإتمام العملية. يرجى إعادة شحن الحساب.',
          type: 'error'
        });
        return;
      }

      setStep('PROCESSING');
      try {
        const updatedBalance = currentBalance - price;
        const uid = 'customer_user';
        await updateUserBalance(uid, updatedBalance);

        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        setGeneratedOrderId(orderId);

        const newOrders = cart.map((item: any, idx: number) => ({
          id: `${orderId}-${idx + 1}`,
          serviceName: item.service.name,
          packageTier: item.package.title,
          wholesaleCost: item.package.wholesaleCost || Number((price * 0.85).toFixed(2)),
          retailPrice: item.package.retailPrice || Number((item.package.priceIQD / 1500).toFixed(2)),
          playerId: item.playerId,
          paymentMethod: 'GamePay Wallet',
          totalAmount: item.package.priceIQD,
          date: new Date().toLocaleString('ar-IQ'),
          timestamp: Date.now(),
          status: 'مكتمل'
        }));

        for (const ord of newOrders) {
          await createOrderRecord({
            userId: uid,
            amountUSD: ord.retailPrice,
            paymentMethod: 'GamePay Wallet',
            status: 'Completed',
            createdAt: new Date().toISOString(),
            orderId: ord.id,
            serviceName: ord.serviceName,
            packageTier: ord.packageTier,
            playerId: ord.playerId,
            totalAmountIQD: ord.totalAmount
          });
        }

        saveCompletedOrder(newOrders);
        dispatchNewOrder(newOrders);

        addToast({
          message: `تم الشراء بنجاح! الرصيد المتبقي: $${updatedBalance.toFixed(2)}`,
          type: 'success'
        });

        setStep('SUCCESS');
        clearCart();
      } catch (err) {
        console.error("Cart wallet checkout error:", err);
        addToast({
          message: 'حدث خطأ أثناء الخصم من المحفظة، يرجى المحاولة مرة أخرى.',
          type: 'error'
        });
        setStep('PAYMENT_SELECT');
      }
      return;
    }

    // Stage 1: SWITCH TO PROCESSING (0ms)
    setStep('PROCESSING');
    
    // Stage 2: SIMULATE GATEWAY FULFILLMENT
    setTimeout(() => {
      // Stage 3: PERSIST ORDER & GENERATE RECEIPT
      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedOrderId(orderId);
      
      const newOrders = cart.map((item: any, idx: number) => ({
        id: `${orderId}-${idx + 1}`,
        serviceName: item.service.name,
        packageTier: item.package.title,
        wholesaleCost: item.package.wholesaleCost,
        retailPrice: item.package.retailPrice,
        playerId: item.playerId,
        paymentMethod: GATEWAYS.find(g => g.id === selectedGateway)?.name || 'Unknown',
        totalAmount: item.package.priceIQD,
        date: new Date().toLocaleString('ar-IQ'),
        timestamp: Date.now(),
        status: 'مكتمل'
      }));
      
      // Save through OrderContext and unified AppContext pipeline
      saveCompletedOrder(newOrders);
      dispatchNewOrder(newOrders);
      
      // Stage 4: SWITCH TO SUCCESS UI & CLEAR CART
      setStep('SUCCESS');
      clearCart();
    }, 2500);
  };

  const handleClose = () => {
    if (step === 'PROCESSING') return;
    setStep('CART_REVIEW');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950/95 border-l border-white/10 z-[60] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-4 sm:px-5 border-b border-white/10 bg-slate-900/60 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleClose}
                  disabled={step === 'PROCESSING'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs sm:text-sm font-bold border border-slate-700/60 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="العودة للمتجر"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                  <span>العودة للمتجر</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-white text-lg tracking-wide">
                    {step === 'SUCCESS' ? 'اكتمل الطلب' : 'سلة المشتريات'}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                disabled={step === 'PROCESSING'}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="إغلاق السلة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto relative z-0">
              <AnimatePresence mode="wait">
                {step === 'CART_REVIEW' && (
                  <motion.div 
                    key="review" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                      {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 py-20 px-4 text-center">
                          <div className="w-20 h-20 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center mb-1">
                            <ShoppingCart className="w-10 h-10 text-slate-500 opacity-60" />
                          </div>
                          <p className="text-lg font-bold text-white">السلة فارغة حالياً</p>
                          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                            لم تقم بإضافة أي خدمات أو بطاقات إلى سلتك بعد. اختر باقاتك المفضلة واستمتع بالشحن الفوري المباشر!
                          </p>
                          <button
                            onClick={handleClose}
                            className="mt-3 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all cursor-pointer active:scale-95"
                          >
                            <span>تصفح جميع الخدمات 🔥</span>
                          </button>
                        </div>
                      ) : (
                        cart.map((item: any, index: number) => (
                          <div key={index} className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex gap-4 relative overflow-hidden group">
                            <img src={item.service.logoUrl} alt={item.service.name} className="w-16 h-16 object-contain bg-[#080b11] p-2 rounded-xl border border-white/5" />
                            <div className="flex-1">
                              <h4 className="text-white font-bold">{item.service.name}</h4>
                              <p className="text-slate-400 text-sm">{item.package.title}</p>
                              {item.playerId !== 'DIGITAL_CODE' && (
                                <p className="text-[#00f0ff] font-mono text-xs mt-1">ID: {item.playerId}</p>
                              )}
                              <p className="text-amber-400 font-bold mt-2 font-mono">
                                {item.package.priceIQD.toLocaleString()} <span className="text-xs">د.ع</span>
                              </p>
                            </div>
                            <button 
                              onClick={() => removeFromCart(index)}
                              className="absolute top-4 left-4 p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {cart.length > 0 && (
                      <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-lg">
                        <div className="flex items-center justify-between mb-4 bg-[#080b11] p-4 rounded-xl border border-white/5">
                          <span className="text-slate-400 font-semibold">المجموع الكلي:</span>
                          <span className="text-2xl font-black text-amber-500 font-mono">
                            {totalIQD.toLocaleString()} <span className="text-sm">د.ع</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => setStep('PAYMENT_SELECT')}
                          className="w-full py-4 bg-amber-500 rounded-xl font-black text-slate-950 text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                          متابعة الدفع
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 'PAYMENT_SELECT' && (
                  <motion.div 
                    key="payment" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 p-6 overflow-y-auto">
                      <button 
                        onClick={() => setStep('CART_REVIEW')}
                        className="text-slate-400 hover:text-white mb-6 text-sm font-bold flex items-center gap-2"
                      >
                        &rarr; رجوع للسلة
                      </button>
                      <h4 className="text-white font-bold mb-4 text-lg">اختر طريقة الدفع:</h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {GATEWAYS.map(gw => (
                          <button 
                            key={gw.id} 
                            onClick={() => setSelectedGateway(gw.id)}
                            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                              selectedGateway === gw.id 
                                ? `border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-white/10 ${gw.color}/20` 
                                : 'border-white/5 bg-[#080b11] hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            {gw.id === 'wallet' ? (
                              <Wallet className={`w-6 h-6 ${selectedGateway === gw.id ? 'text-emerald-400' : ''}`} />
                            ) : (
                              <CreditCard className={`w-6 h-6 ${selectedGateway === gw.id ? 'text-white' : ''}`} />
                            )}
                            <span className={`text-xs font-bold text-center ${selectedGateway === gw.id ? 'text-white' : ''}`}>{gw.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Wallet Balance Status in Cart */}
                      {selectedGateway === 'wallet' && (
                        <div className={`p-4 rounded-xl border mb-4 text-xs transition-all ${
                          balance < totalUSD 
                            ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold flex items-center gap-1.5 text-white">
                              <Wallet className="w-4 h-4 text-emerald-400" />
                              رصيد محفظة GamePay الفوري
                            </span>
                            <span className="font-mono font-bold text-sm text-emerald-400">
                              ${balance.toFixed(2)} USD
                            </span>
                          </div>

                          {balance < totalUSD ? (
                            <div className="flex items-start gap-2 text-red-300 mt-2 pt-2 border-t border-red-500/20">
                              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              <span>رصيد المحفظة غير كافٍ لإتمام العملية (${balance.toFixed(2)} متاح / مطلوب ${totalUSD.toFixed(2)}). يرجى شحن الحساب.</span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-slate-300 mt-1 pt-2 border-t border-emerald-500/20 text-[11px]">
                              <span>الرصيد المتبقي بعد الخصم:</span>
                              <span className="font-mono font-bold text-emerald-300">${(balance - totalUSD).toFixed(2)} USD</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-lg">
                      <div className="flex items-center justify-between mb-4 bg-[#080b11] p-4 rounded-xl border border-white/5">
                        <span className="text-slate-400 font-semibold">المجموع الكلي:</span>
                        <div className="text-left font-mono">
                          <span className="text-2xl font-black text-amber-500 block">
                            {totalIQD.toLocaleString()} <span className="text-sm">د.ع</span>
                          </span>
                          <span className="text-xs text-slate-400 font-bold block">
                            ≈ ${totalUSD.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={handleCheckout}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-black text-white text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                      >
                        تأكيد الدفع وإتمام الطلب
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'PROCESSING' && (
                  <motion.div 
                    key="processing" 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="flex flex-col items-center justify-center h-full p-10 text-center"
                  >
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-[#ff6b00]/20 rounded-full absolute top-0 left-0"></div>
                      <div className="w-24 h-24 border-4 border-transparent border-t-[#ff6b00] border-r-[#ff6b00] rounded-full animate-spin relative z-10 shadow-[0_0_20px_rgba(255,107,0,0.4)]"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[#ff6b00]">
                        <Gamepad2 className="w-8 h-8 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">جاري معالجة الدفع والشحن...</h2>
                    <p className="text-[#ff6b00] animate-pulse font-mono text-sm bg-[#ff6b00]/10 px-3 py-1.5 rounded-lg border border-[#ff6b00]/20">Connecting to B2B Gateways...</p>
                  </motion.div>
                )}

                {step === 'SUCCESS' && (
                  <motion.div 
                    key="success" 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="flex flex-col h-full p-6"
                  >
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h2 className="text-3xl font-black text-white mb-8 text-center">تم التنفيذ بنجاح!</h2>
                      
                      <div className="w-full bg-[#080b11] p-6 rounded-2xl mb-6 border border-white/10 text-right shadow-inner relative overflow-hidden text-sm">
                        <div className="absolute -right-5 -top-5 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                        
                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">رقم الطلب (Order ID)</span><span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded-md">{generatedOrderId}</span></div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">الخدمة</span><span className="text-white font-bold">طلبات متعددة</span></div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-3"><span className="text-slate-500">وسيلة الدفع</span><span className="text-white">{GATEWAYS.find(g => g.id === selectedGateway)?.name}</span></div>
                          <div className="flex justify-between items-center"><span className="text-slate-500">إجمالي المبلغ</span><span className="font-mono text-amber-500 font-bold">{totalIQD.toLocaleString()} د.ع</span></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto space-y-3">
                      <button onClick={() => {
                        const fakeOrder = {
                          id: generatedOrderId,
                          serviceName: 'طلبات متعددة (سلة)',
                          playerId: 'متعدد',
                          packageTier: cart.map((c: any) => c.package.title).join(', '),
                          paymentMethod: GATEWAYS.find(g => g.id === selectedGateway)?.name || 'Unknown',
                          totalAmount: totalIQD,
                          date: new Date().toLocaleString('ar-IQ')
                        };
                        downloadPDFReceipt(fakeOrder);
                      }} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-amber-500 font-bold flex items-center justify-center transition-colors">
                        تحميل الفاتورة PDF
                      </button>
                      <button onClick={handleClose} className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold transition-all">
                        إغلاق
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
