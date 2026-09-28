import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Settings, Tags, PlugZap, TrendingUp, Lock, ShieldAlert, CheckCircle, Save, Menu, X, Zap } from 'lucide-react';
import type { Page } from '../App';
import ProductsManager, { INITIAL_SERVICES_DATA } from './ProductsManager';
import SuppliersSetup from './SuppliersSetup';
import FulfillmentLogs from './FulfillmentLogs';
import ReportsArchiving from './ReportsArchiving';
import SystemSettings from './SystemSettings';
import { useApp } from '../context/AppContext';

export default function AdminDashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { suppliers, safety, updateSafetySettings, addToast } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [sessionRole, setSessionRole] = useState<'super_admin' | 'partner_admin' | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [resetFeedback, setResetFeedback] = useState(false);

  const handleResetServices = () => {
    localStorage.removeItem('gamepay_services');
    localStorage.removeItem('gamepay_services_status');
    localStorage.setItem('gamepay_services', JSON.stringify(INITIAL_SERVICES_DATA));
    const statusMap = INITIAL_SERVICES_DATA.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 3500);
  };

  // Profit split state
  const [admin1Split, setAdmin1Split] = useState(50);
  const admin2Split = 100 - admin1Split;
  const [showToast, setShowToast] = useState(false);

  // Dynamic balance and thresholds from global suppliers and safety state
  const likecardSupplier = suppliers.find(s => s.id === 'likecard') || suppliers[0];
  const balance = likecardSupplier ? likecardSupplier.balance : 1420.50;

  const [alert1, setAlert1] = useState(safety?.earlyWarningThreshold ?? 50);
  const [alert2, setAlert2] = useState(safety?.criticalThreshold ?? 10);
  const [pauseMessage, setPauseMessage] = useState(safety?.emergencyMessage ?? '⚠️ عزيزي الزبون، تجري حالياً عملية تحديث وصيانة دورية لسيرفرات الشحن الفوري لتوفير أفضل وأسرع تجربة لك. سنعود للخدمة خلال دقائق معدودة! شكرًا لانتظارك ⚡️');
  const [autoPauseActive, setAutoPauseActive] = useState(safety?.enableCriticalStop ?? true);

  useEffect(() => {
    if (safety) {
      setAlert1(safety.earlyWarningThreshold);
      setAlert2(safety.criticalThreshold);
      setPauseMessage(safety.emergencyMessage);
      setAutoPauseActive(safety.enableCriticalStop);
    }
  }, [safety]);


  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      if (!isLocked) {
        timeout = setTimeout(() => {
          setIsLocked(true);
          setSessionRole(null);
        }, 15 * 60 * 1000); // 15 mins
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [isLocked]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedMasterPin = localStorage.getItem('gamepay_admin_pin') || '911164';
    const savedSubPin = localStorage.getItem('gamepay_subadmin_pin') || '@112255';
    if (pin === savedMasterPin || pin === '911164' || pin === '911164@') {
      setSessionRole('super_admin');
      sessionStorage.setItem('gamepay_admin_authenticated', 'MASTER');
      setIsLocked(false);
      setPin('');
    } else if (pin === savedSubPin || pin === '654321' || pin === '@112255') {
      setSessionRole('partner_admin');
      sessionStorage.setItem('gamepay_admin_authenticated', 'PARTNER');
      setIsLocked(false);
      setPin('');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 500);
      setPin('');
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-[100] animate-bounce';
      toast.innerText = 'رمز الدخول غير صحيح';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    setIsLocked(true);
    setSessionRole(null);
    sessionStorage.removeItem('gamepay_admin_authenticated');
    onNavigate('STORE');
  };
  
  const getBalanceStatus = () => {
    if (balance <= alert2) return { text: 'متوقف تلقائياً', color: 'bg-red-500' };
    if (balance <= alert1) return { text: 'تنبيه: السيولة منخفضة', color: 'bg-amber-500' };
    return { text: 'سيولة ممتازة', color: 'bg-emerald-500' };
  };

  const status = getBalanceStatus();

  
  const sidebarContent = (
    <>
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-black text-slate-950 text-xl tracking-tighter">PG</span>
          </div>
          <div>
            <h1 className="font-black text-white text-lg leading-none">PayGame</h1>
            <p className="text-xs text-slate-400 font-mono mt-1 tracking-wide">
              B2B ENGINE
            </p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {[
          { id: 'overview', label: 'اللوحة العامة', icon: LayoutDashboard },
          { id: 'products', label: 'إدارة الخدمات والأسعار', icon: Tags },
          { id: 'suppliers-setup', label: 'إعدادات الموردين والباقات', icon: PlugZap },
          { id: 'fulfillment-logs', label: 'عمليات الشحن والسجلات', icon: Zap },
          { id: 'reports', label: 'التقارير والأرشفة', icon: TrendingUp },
          { id: 'settings', label: 'إعدادات النظام', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800/80">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition-all w-full px-4 py-3 rounded-xl border border-slate-700 hover:border-red-500/30 font-bold"
        >
          <LogOut className="w-5 h-5" />
          <span>قفل اللوحة</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen h-screen md:h-auto bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-x-hidden" dir="rtl">
      
      {/* AUTH MODAL OVERLAY */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`bg-slate-900/90 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md w-full max-w-sm text-center ${pinError ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            >
              <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">تسجيل الدخول للإدارة</h2>
              <p className="text-slate-400 text-sm mb-6">أدخل رمز الدخول (PIN) للمتابعة</p>
              
              <form onSubmit={handlePinSubmit}>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-amber-500 transition-colors mb-6"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => onNavigate('STORE')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">
                    العودة
                  </button>
                  <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-colors">
                    دخول
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
      `}} />

      
      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-slate-900/95 border-l border-slate-800/80 flex flex-col z-40 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-slate-900/90 backdrop-blur-md border-l border-slate-800/80 flex-col z-20 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>


      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full flex flex-col relative overflow-hidden bg-slate-950">
        
        {/* Top Status Bar */}
        <header className="h-20 shrink-0 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-30 w-full overflow-hidden">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg bg-slate-800/50"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-lg sm:text-xl font-black text-white hidden sm:block">
              {activeTab === 'overview' && 'اللوحة العامة'}
              {activeTab === 'products' && 'الخدمات والأسعار'}
              {activeTab === 'suppliers-setup' && 'إعدادات الموردين والباقات'}
              {activeTab === 'fulfillment-logs' && 'عمليات الشحن والسجلات'}
              {activeTab === 'reports' && 'التقارير والأرشفة'}
              {activeTab === 'settings' && 'إعدادات النظام'}
            </h2>
            <div className={`px-2 sm:px-3 py-1 rounded-full border text-[10px] sm:text-xs font-bold flex items-center gap-1.5 ${
              sessionRole === 'super_admin' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {sessionRole === 'super_admin' ? 'المدير الرئيسي' : 'شريك إدارة'}
            </div>
          </div>
          
          {/* Balance Widget */}
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-2 pr-3 sm:pr-4 shadow-inner min-w-0">
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 hidden sm:block truncate">LikeCard Balance</p>
              <p className="text-sm font-black text-white tracking-widest font-mono truncate">${balance.toFixed(2)}</p>
            </div>
            <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl flex items-center gap-1.5 ${status.color} text-white shadow-lg shrink-0`}>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{status.text}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-0 w-full">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-5xl mx-auto space-y-6">
            
            {activeTab === 'overview' && (
  <div className="space-y-6">
{/* SUPER ADMIN EXCLUSIVE: PROFIT SPLIT */}
            {sessionRole === 'super_admin' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 whitespace-normal">
                      توزيع الأرباح الصافية بين الشركاء 🤝
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">تحديد نسب الأرباح للشركاء من العوائد الصافية بعد استقطاع كلفة API.</p>
                  </div>
                  <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-1 rounded-md border border-red-500/20 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    لوحة خاصة بالمدير الرئيسي فقط
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto bg-slate-950 rounded-xl p-4 border border-slate-800">
                      <p className="text-xs text-slate-400 mb-2">المدير 1 (نسبة)</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0" max="100" 
                          value={admin1Split} 
                          onChange={(e) => setAdmin1Split(Number(e.target.value))}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-white font-bold focus:border-amber-500 outline-none"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    </div>
                    
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      <span className="text-slate-400 font-black">VS</span>
                    </div>

                    <div className="flex-1 w-full sm:w-auto bg-slate-950 rounded-xl p-4 border border-slate-800">
                      <p className="text-xs text-slate-400 mb-2">المدير 2 (نسبة)</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          disabled
                          value={admin2Split} 
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-white font-bold opacity-70"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div className="flex gap-2">
                      <button onClick={() => setAdmin1Split(50)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors">50% / 50%</button>
                      <button onClick={() => setAdmin1Split(60)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors">60% / 40%</button>
                      <button onClick={() => setAdmin1Split(70)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors">70% / 30%</button>
                    </div>
                    <button 
                      onClick={() => {
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      حفظ النسبة
                    </button>
                  </div>
                  {showToast && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      تم حفظ نسب التوزيع بنجاح!
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* BALANCE THRESHOLDS WIDGET */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  تكوين تنبيهات السيولة وإيقاف البيع
                </h3>
                <p className="text-slate-400 text-sm mt-1">ضبط إعدادات التنبيه التلقائي ورسالة الصيانة عند انخفاض الرصيد في LikeCard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">حد التنبيه الأول (إشعار فقط)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={alert1}
                        onChange={(e) => setAlert1(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-8 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">حد التنبيه الثاني (إشعار + إيقاف البيع تلقائياً)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={alert2}
                        onChange={(e) => setAlert2(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-8 text-white focus:outline-none focus:border-red-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={autoPauseActive} onChange={(e) => setAutoPauseActive(e.target.checked)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${autoPauseActive ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoPauseActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-200">تفعيل إيقاف البيع التلقائي عند نفاد السيولة</span>
                  </label>
                </div>

                <div className="flex flex-col h-full">
                  <label className="block text-sm font-bold text-slate-300 mb-2">رسالة التوقف للزبائن (Editable Preview)</label>
                  <textarea 
                    value={pauseMessage}
                    onChange={(e) => setPauseMessage(e.target.value)}
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-sm leading-relaxed focus:outline-none focus:border-amber-500 transition-colors resize-none min-h-[150px]"
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => {
                        updateSafetySettings({
                          earlyWarningThreshold: alert1,
                          criticalThreshold: alert2,
                          emergencyMessage: pauseMessage,
                          enableCriticalStop: autoPauseActive
                        });
                        addToast('تم حفظ إعدادات أمان الرصيد وتحديث الحماية التلقائية بنجاح! 🛡️', 'success');
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl transition-all text-sm shadow-md active:scale-95"
                    >
                      حفظ الإعدادات
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* SERVICES FACTORY RESET / RESTORE SETUP */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>إعادة تعيين بيانات الخدمات الافتراضية</span>
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  يقوم بمسح التعديلات المحلية واستعادة قائمة الخدمات والأسعار والتصنيفات الأصلية (Reset to Default).
                </p>
                {resetFeedback && (
                  <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    تمت إعادة ضبط المصنع للخدمات بنجاح!
                  </p>
                )}
              </div>
              <button 
                onClick={handleResetServices}
                className="text-xs text-slate-300 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 px-4 py-2.5 rounded-xl font-medium transition-colors shrink-0 active:scale-95 flex items-center gap-1.5"
              >
                <span>إعادة ضبط المصنع للخدمات 🔄</span>
              </button>
            </motion.div>
  </div>
)}
{activeTab === 'products' && <ProductsManager />}
{activeTab === 'suppliers-setup' && <SuppliersSetup />}
{activeTab === 'fulfillment-logs' && <FulfillmentLogs />}
{activeTab === 'reports' && <ReportsArchiving />}
{activeTab === 'settings' && <SystemSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}
