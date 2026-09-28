import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Search, Clock, PlayCircle, 
  CheckCircle2, XCircle, AlertCircle, LayoutDashboard,
  LogOut, Wallet, Activity, Bell, Check, Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useOrderContext, Order, OrderStatus } from '../context/OrderContext';

const CURRENT_EMPLOYEE_ID = "EMP-001"; // Simulated logged in user

export default function EmployeeDashboard({ onNavigate }: { onNavigate: (page: any) => void }) {
  const { orders } = useOrderContext();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'PENDING' | 'MY_ORDERS'>('PENDING');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState<Order | null>(null);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Fast Client-Side Image Compression using Canvas
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 800; // Optimal size for speed and readability

          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress heavily for extreme speed (JPEG 0.5 quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          setReceiptUrl(compressedBase64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: OrderStatus, receipt?: string) => {
    // Optimistic UI updates for instant perceived performance
    if (newStatus === 'COMPLETED') {
      setShowCompletionModal(null);
      setReceiptUrl("");
    }
    
    setIsProcessing(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          employeeId: CURRENT_EMPLOYEE_ID,
          receiptUrl: receipt
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update order');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating order');
    } finally {
      setIsProcessing(null);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.playerId.includes(searchQuery);
        
      if (activeTab === 'PENDING') {
        return order.status === 'PENDING' && matchesSearch;
      } else {
        return (order.claimedBy === CURRENT_EMPLOYEE_ID && ['IN_PROGRESS', 'COMPLETED', 'FAILED'].includes(order.status)) && matchesSearch;
      }
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [orders, searchQuery, activeTab]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'IN_PROGRESS': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'FAILED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Activity className="w-4 h-4 animate-pulse" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" />;
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'قيد الانتظار';
      case 'IN_PROGRESS': return 'قيد الشحن';
      case 'COMPLETED': return 'مكتمل';
      case 'FAILED': return 'فشل / مرفوض';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#05070c] relative font-sans text-slate-200" dir="rtl">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] opacity-80 blur-[150px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] opacity-80 blur-[150px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-2xl border-b md:border-b-0 md:border-l border-white/10 flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)]">
            <Gamepad2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">Game<span className="text-[#ff6b00] drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]">Pay</span></h1>
            <p className="text-xs text-[#00f0ff] font-bold tracking-widest drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] uppercase">Dispatch Engine</p>
          </div>
        </div>
        
        <div className="px-4 py-2 border-y border-white/5 bg-white/[0.02]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <p className="text-sm font-medium text-slate-300">متصل - {CURRENT_EMPLOYEE_ID}</p>
            </div>
            <div className="flex justify-between items-center bg-[#080b11] px-3 py-1.5 rounded-lg border border-white/5">
              <span className="text-xs text-slate-400">الطلبات المنجزة</span>
              <span className="text-emerald-400 font-bold text-sm">{orders.filter(o => o.status === 'COMPLETED' && o.claimedBy === CURRENT_EMPLOYEE_ID).length}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'PENDING' ? 'bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">الطلبات المتاحة</span>
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <span className="mr-auto bg-[#ff6b00] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'PENDING').length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('MY_ORDERS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'MY_ORDERS' ? 'bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">مهامي الحالية</span>
            {orders.filter(o => o.status === 'IN_PROGRESS' && o.claimedBy === CURRENT_EMPLOYEE_ID).length > 0 && (
              <span className="mr-auto bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {orders.filter(o => o.status === 'IN_PROGRESS' && o.claimedBy === CURRENT_EMPLOYEE_ID).length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => onNavigate('LOGIN')}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors w-full px-2 py-2"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {activeTab === 'PENDING' ? 'سجل الطلبات المتاحة' : 'قائمة مهامي'}
            </h2>
            <p className="text-slate-400 text-sm">
              {activeTab === 'PENDING' 
                ? 'قم بقبول الطلبات الجديدة لبدء التنفيذ.' 
                : 'أدر الطلبات التي قمت باستلامها هنا.'}
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="ابحث برقم الطلب أو اللاعب..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 text-white pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-[#ff6b00]/50 focus:ring-1 focus:ring-[#ff6b00]/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl bg-[#111827]/50">
            <LayoutDashboard className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">لا توجد طلبات هنا</h3>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery ? 'لم يتم العثور على نتائج مطابقة لبحثك.' : 'القائمة فارغة في الوقت الحالي.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map(order => (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#111827] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all"
                >
                  {/* Decorative Glow if PENDING */}
                  {order.status === 'PENDING' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b00]/10 blur-[50px] -mr-10 -mt-10 pointer-events-none" />
                  )}
                  {/* Decorative Glow if IN PROGRESS */}
                  {order.status === 'IN_PROGRESS' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] -mr-10 -mt-10 pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-white tracking-wider">{order.id}</h4>
                        <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        منذ {formatDistanceToNow(new Date(order.updatedAt))}
                      </p>
                    </div>
                    <div className="bg-[#080b11] px-3 py-1.5 rounded-lg border border-white/5">
                      <span className="text-[#ff6b00] font-mono font-bold">{order.gameType}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-slate-500 text-xs mb-1">معرف اللاعب (Player ID)</p>
                      <p className="text-white font-mono font-medium tracking-wider">{order.playerId}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-slate-500 text-xs mb-1">الكمية المطلوبة</p>
                      <p className="text-white font-bold text-cyan-400">{order.packageDetails}</p>
                    </div>
                  </div>

                  {/* Action Controls based on State */}
                  <div className="pt-4 border-t border-white/5 flex gap-3 relative z-10">
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                        disabled={isProcessing === order.id}
                        className="flex-1 bg-gradient-to-r from-[#ff6b00] to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_14px_rgba(255,107,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {isProcessing === order.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            استلام الطلب فوراً
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'IN_PROGRESS' && order.claimedBy === CURRENT_EMPLOYEE_ID && (
                      <>
                        <button 
                          onClick={() => setShowCompletionModal(order)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          إكمال العملية
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (window.confirm("هل أنت متأكد من رفض/إرجاع هذا الطلب؟ سيعود للقائمة العامة.")) {
                              handleUpdateStatus(order.id, 'FAILED');
                            }
                          }}
                          disabled={isProcessing === order.id}
                          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50"
                          title="إرجاع الطلب"
                        >
                          {isProcessing === order.id ? (
                            <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </button>
                      </>
                    )}

                    {order.status === 'COMPLETED' && (
                      <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        تم إكمال الطلب
                      </div>
                    )}
                    
                    {order.status === 'FAILED' && (
                      <div className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
                        <XCircle className="w-5 h-5" />
                        الطلب مرفوض / فشل
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCompletionModal(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
              dir="rtl"
            >
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white">إكمال الطلب</h3>
                <p className="text-sm text-slate-400 mt-1">الرجاء إرفاق رابط صورة إيصال الدفع لتأكيد العملية.</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm">رقم الطلب</span>
                    <span className="text-white font-mono">{showCompletionModal.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">معرف اللاعب</span>
                    <span className="text-white font-mono">{showCompletionModal.playerId}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">صورة إيصال الدفع</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-[#080b11] border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                  />
                  {receiptUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                      <img src={receiptUrl} alt="Receipt preview" className="w-full h-48 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    الرجاء رفع صورة واضحة ومقروءة للإيصال.
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-white/10 flex gap-3">
                <button 
                  onClick={() => setShowCompletionModal(null)}
                  className="flex-1 px-4 py-2.5 bg-transparent border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => handleUpdateStatus(showCompletionModal.id, 'COMPLETED', receiptUrl)}
                  disabled={!receiptUrl || isProcessing === showCompletionModal.id}
                  className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing === showCompletionModal.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      تأكيد وإرسال
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
