import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  RotateCcw, 
  FileCode, 
  CheckCircle, 
  X,
  Wallet,
  ShieldAlert,
  Sliders,
  Check,
  Plus,
  Edit3,
  Trash2,
  Bell,
  MessageSquare,
  Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SupplierConfig, SafetySettings } from './SuppliersSetup';

export interface ApiLogItem {
  id: string;
  timestamp: string;
  orderId: string;
  serviceName: string;
  supplier: string;
  endpoint: string;
  method: 'POST' | 'GET';
  statusCode: number;
  statusText: string;
  responseTime: string;
  requestPayload: any;
  responsePayload: any;
}

const DEFAULT_SUPPLIERS: SupplierConfig[] = [
  {
    id: 'likecard',
    name: 'LikeCard B2B API',
    badge: 'المورد الرئيسي للأكواد',
    type: 'بطاقات الهدايا وأكواد الألعاب (Vouchers)',
    apiKey: 'lk_live_8f7b2c9e10a44d8e78a',
    apiSecret: 'sk_sec_9941a876c2de0019284',
    merchantId: 'MERCHANT_IQ_911',
    env: 'production',
    balance: 1420.50,
    lowBalanceAlert: 50.00,
    criticalBalanceAlert: 10.00,
    isConnected: true,
    latency: '118ms',
    lastChecked: 'الآن'
  }
];

const DEFAULT_SAFETY_SETTINGS: SafetySettings = {
  autoFulfill: true,
  enableCriticalStop: true,
  earlyWarningThreshold: 50.00,
  criticalThreshold: 10.00,
  emergencyMessage: 'الخدمة متوقفة مؤقتاً لأغراض الصيانة والتحديث، يرجى المحاولة بعد قليل.'
};

const INITIAL_LOGS: ApiLogItem[] = [
  {
    id: 'log-101',
    timestamp: '2026-09-18 17:12:04',
    orderId: '#GP-99421',
    serviceName: 'ببجي موبايل (PUBG Mobile)',
    supplier: 'LikeCard B2B API',
    endpoint: '/api/v1/orders/create',
    method: 'POST',
    statusCode: 200,
    statusText: '200 OK / Success',
    responseTime: '114ms',
    requestPayload: {
      merchant_id: 'MERCHANT_IQ_911',
      product_id: '1042',
      quantity: 1,
      order_reference: 'GP-99421',
      recipient_player_id: '512889201'
    },
    responsePayload: {
      status: 'success',
      order_id: 'LC_ORD_8849201',
      voucher_code: 'PBG-9940-2218-4491',
      serial: 'SN-4410298',
      fulfilled_at: '2026-09-18T17:12:04Z'
    }
  },
  {
    id: 'log-102',
    timestamp: '2026-09-18 17:09:40',
    orderId: '#GP-99419',
    serviceName: 'فري فاير (Free Fire)',
    supplier: 'LikeCard B2B API',
    endpoint: '/api/v1/orders/create',
    method: 'POST',
    statusCode: 200,
    statusText: '200 OK / Success',
    responseTime: '128ms',
    requestPayload: {
      merchant_id: 'MERCHANT_IQ_911',
      product_id: '1045',
      quantity: 1,
      order_reference: 'GP-99419',
      recipient_player_id: '99018241'
    },
    responsePayload: {
      status: 'success',
      order_id: 'LC_ORD_8849188',
      voucher_code: 'FF-7721-0092-8813',
      fulfilled_at: '2026-09-18T17:09:40Z'
    }
  },
  {
    id: 'log-103',
    timestamp: '2026-09-18 17:03:15',
    orderId: '#GP-99415',
    serviceName: 'روبلوكس (Roblox)',
    supplier: 'LikeCard B2B API',
    endpoint: '/api/v1/orders/create',
    method: 'POST',
    statusCode: 400,
    statusText: '400 Bad Request',
    responseTime: '210ms',
    requestPayload: {
      merchant_id: 'MERCHANT_IQ_911',
      product_id: '9999',
      quantity: 1,
      order_reference: 'GP-99415'
    },
    responsePayload: {
      status: 'failed',
      error_code: 'INVALID_PRODUCT_ID',
      message: 'Product ID 9999 does not exist in active supplier catalog.'
    }
  },
  {
    id: 'log-104',
    timestamp: '2026-09-18 16:51:22',
    orderId: '#GP-99408',
    serviceName: 'بطاقات آيتونز أمريكي (iTunes US)',
    supplier: 'LikeCard B2B API',
    endpoint: '/api/v1/orders/create',
    method: 'POST',
    statusCode: 500,
    statusText: '500 Supplier Error',
    responseTime: '450ms',
    requestPayload: {
      merchant_id: 'MERCHANT_IQ_911',
      product_id: '1051',
      quantity: 1,
      order_reference: 'GP-99408'
    },
    responsePayload: {
      status: 'error',
      error_code: 'PROVIDER_TIMEOUT',
      message: 'Supplier gateway timeout while generating digital voucher.'
    }
  },
  {
    id: 'log-105',
    timestamp: '2026-09-18 16:40:05',
    orderId: '#GP-99395',
    serviceName: 'ستيم والت (Steam USD)',
    supplier: 'LikeCard B2B API',
    endpoint: '/api/v1/orders/create',
    method: 'POST',
    statusCode: 200,
    statusText: '200 OK / Success',
    responseTime: '98ms',
    requestPayload: {
      merchant_id: 'MERCHANT_IQ_911',
      product_id: '1060',
      quantity: 1,
      order_reference: 'GP-99395'
    },
    responsePayload: {
      status: 'success',
      order_id: 'LC_ORD_8849001',
      voucher_code: 'STM-USD-10-8842-88',
      fulfilled_at: '2026-09-18T16:40:05Z'
    }
  }
];

export default function FulfillmentLogs() {
  const { apiLogs: globalApiLogs } = useApp();

  // 1. Suppliers State (Cleaned: ONLY LikeCard or user-added suppliers)
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>(() => {
    const saved = localStorage.getItem('gamepay_suppliers_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter((s: any) => 
          s.id === 'likecard' || 
          (!s.id.includes('smm') && !s.id.includes('direct') && !s.name.includes('Custom') && !s.name.includes('Direct'))
        );
        if (cleaned.length > 0) {
          return cleaned.map((s: any) => ({
            ...s,
            lowBalanceAlert: s.lowBalanceAlert ?? 50,
            criticalBalanceAlert: s.criticalBalanceAlert ?? 10
          }));
        }
      } catch (e) {}
    }
    return DEFAULT_SUPPLIERS;
  });

  const likecard = suppliers.find(s => s.id === 'likecard') || suppliers[0] || DEFAULT_SUPPLIERS[0];

  // 2. Safety Settings & Dual Thresholds
  const [safety, setSafety] = useState<SafetySettings>(() => {
    const saved = localStorage.getItem('gamepay_safety_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SAFETY_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    const legacyRules = localStorage.getItem('gamepay_fulfillment_rules');
    if (legacyRules) {
      try {
        const parsed = JSON.parse(legacyRules);
        return {
          autoFulfill: parsed.autoFulfill ?? true,
          enableCriticalStop: parsed.stopOnLowBalance ?? true,
          earlyWarningThreshold: parsed.earlyWarningThreshold ?? 50,
          criticalThreshold: parsed.criticalThreshold ?? 10,
          emergencyMessage: parsed.emergencyMessage ?? DEFAULT_SAFETY_SETTINGS.emergencyMessage
        };
      } catch (e) {}
    }
    return DEFAULT_SAFETY_SETTINGS;
  });

  // 3. API Logs State (Synced with AppContext)
  const [logs, setLogs] = useState<ApiLogItem[]>(() => {
    if (globalApiLogs && globalApiLogs.length > 0) {
      return globalApiLogs;
    }
    const savedLogs = localStorage.getItem('gamepay_api_logs');
    return savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
  });

  useEffect(() => {
    if (globalApiLogs && globalApiLogs.length > 0) {
      setLogs(globalApiLogs);
    }
  }, [globalApiLogs]);


  // UI state
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'error' } | null>(null);
  const [selectedLogForModal, setSelectedLogForModal] = useState<ApiLogItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [logsFilterStatus, setLogsFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Modals for Supplier Management
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // New Supplier Form
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    badge: 'مورد معتمد',
    type: 'شحن أكواد وبطاقات رقمية',
    merchantId: '',
    apiKey: '',
    apiSecret: '',
    env: 'production' as 'production' | 'sandbox',
    balance: 500,
    lowBalanceAlert: 50,
    criticalBalanceAlert: 10
  });

  // Edit Supplier Form
  const [editSupplierForm, setEditSupplierForm] = useState({
    name: likecard.name,
    badge: likecard.badge,
    merchantId: likecard.merchantId,
    balance: likecard.balance,
    lowBalanceAlert: likecard.lowBalanceAlert,
    criticalBalanceAlert: likecard.criticalBalanceAlert,
    env: likecard.env
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state
  useEffect(() => {
    localStorage.setItem('gamepay_suppliers_config', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('gamepay_safety_settings', JSON.stringify(safety));
    localStorage.setItem('gamepay_fulfillment_rules', JSON.stringify({
      autoFulfill: safety.autoFulfill,
      stopOnLowBalance: safety.enableCriticalStop,
      earlyWarningThreshold: safety.earlyWarningThreshold,
      criticalThreshold: safety.criticalThreshold,
      emergencyMessage: safety.emergencyMessage
    }));
  }, [safety]);

  useEffect(() => {
    localStorage.setItem('gamepay_api_logs', JSON.stringify(logs));
  }, [logs]);

  // Handler: Update Dual Thresholds
  const handleUpdateEarlyThreshold = (val: number) => {
    setSafety(s => ({ ...s, earlyWarningThreshold: val }));
    const updated = suppliers.map(s => s.id === likecard.id ? { ...s, lowBalanceAlert: val } : s);
    setSuppliers(updated);
  };

  const handleUpdateCriticalThreshold = (val: number) => {
    setSafety(s => ({ ...s, criticalThreshold: val }));
    const updated = suppliers.map(s => s.id === likecard.id ? { ...s, criticalBalanceAlert: val } : s);
    setSuppliers(updated);
  };

  // Handler: Retry Failed API Log
  const handleRetryApiLog = (logId: string) => {
    setRetryingLogId(logId);
    setTimeout(() => {
      setLogs(prev => prev.map(l => {
        if (l.id === logId) {
          return {
            ...l,
            statusCode: 200,
            statusText: '200 OK / Success (Manual Retry)',
            responseTime: '115ms',
            responsePayload: {
              ...l.responsePayload,
              status: 'success',
              retry_resolved: true,
              resolved_at: new Date().toLocaleTimeString('ar-EG'),
              message: 'تم إعادة إرسال الطلب واعتماده بنجاح من المورد.'
            }
          };
        }
        return l;
      }));
      setRetryingLogId(null);
      showToast('🔁 تمت إعادة إرسال الطلب بنجاح وتم الشحن الفوري!');
    }, 1200);
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(`تم نسخ ${label} إلى الحافظة`);
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    setEditSupplierForm({
      name: likecard.name,
      badge: likecard.badge,
      merchantId: likecard.merchantId,
      balance: likecard.balance,
      lowBalanceAlert: likecard.lowBalanceAlert,
      criticalBalanceAlert: likecard.criticalBalanceAlert,
      env: likecard.env
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuppliers(prev => prev.map(s => s.id === likecard.id ? {
      ...s,
      name: editSupplierForm.name,
      badge: editSupplierForm.badge,
      merchantId: editSupplierForm.merchantId,
      balance: Number(editSupplierForm.balance),
      lowBalanceAlert: Number(editSupplierForm.lowBalanceAlert),
      criticalBalanceAlert: Number(editSupplierForm.criticalBalanceAlert),
      env: editSupplierForm.env
    } : s));
    setIsEditModalOpen(false);
    showToast('✏️ تم تحديث بيانات المورد بنجاح');
  };

  // Add New Supplier
  const handleAddNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newSupplierForm?.name || '').trim()) {
      showToast('يرجى تحديد اسم المورد', 'error');
      return;
    }
    const newSup: SupplierConfig = {
      id: `sup_${Date.now()}`,
      name: (newSupplierForm.name || '').trim(),
      badge: (newSupplierForm.badge || '').trim() || 'مورد API',
      type: (newSupplierForm.type || '').trim() || 'بطاقات وأكواد',
      merchantId: (newSupplierForm.merchantId || '').trim() || 'MERCHANT_NEW',
      apiKey: (newSupplierForm.apiKey || '').trim() || 'api_key_default',
      apiSecret: (newSupplierForm.apiSecret || '').trim() || 'api_secret_default',
      env: newSupplierForm.env,
      balance: Number(newSupplierForm.balance) || 500,
      lowBalanceAlert: Number(newSupplierForm.lowBalanceAlert) || 50,
      criticalBalanceAlert: Number(newSupplierForm.criticalBalanceAlert) || 10,
      isConnected: true,
      latency: '115ms',
      lastChecked: 'الآن'
    };
    setSuppliers(prev => [...prev, newSup]);
    setIsAddModalOpen(false);
    showToast(`✅ تم إضافة المورد "${newSup.name}" بنجاح`);
  };

  // Delete Supplier
  const handleDeleteSupplier = () => {
    if (suppliers.length <= 1) {
      showToast('⚠️ لا يمكن حذف المورد الأساسي الوحيد!', 'error');
      setIsDeleteModalOpen(false);
      return;
    }
    setSuppliers(prev => prev.filter(s => s.id !== likecard.id));
    setIsDeleteModalOpen(false);
    showToast('🗑️ تم حذف المورد بنجاح');
  };

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    if (logsFilterStatus === 'all') return true;
    if (logsFilterStatus === 'success') return l.statusCode === 200;
    if (logsFilterStatus === 'failed') return l.statusCode !== 200;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 text-slate-100 font-sans" dir="rtl">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border backdrop-blur-xl ${
              toastMessage.type === 'error' 
                ? 'bg-red-500/90 text-white border-red-400/50 shadow-red-500/20' 
                : 'bg-slate-900/95 text-amber-400 border-amber-500/50 shadow-amber-500/20'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER: مركز عمليات الشحن وسجلات الـ API ⚡                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">مركز عمليات الشحن وسجلات الـ API ⚡</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مراقبة رصيد المورد اللحظي، التحكم بالشحن الآلي، وتتبع الطلبات الصادرة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>بث العمليات اللحظي نشط</span>
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION A: كروت الرصيد ومفاتيح الأمان وحدود التنبيه ورسالة الطوارئ  */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Live Balance Cards Grid & Card Action Menu (تعديل ✏️ / حذف 🗑️) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <span>رصيد المورد المباشر (Live Supplier Balance)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              متابعة الرصيد المالي المتاح لدى {likecard.name} للشحن المباشر دون انقطاع
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary: LikeCard Balance Card with Card Action Menu */}
            <div className="p-4 rounded-xl border bg-slate-950/80 border-slate-800 min-w-[280px] sm:min-w-[320px] flex flex-col justify-between relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>{likecard.name}</span>
                </span>
                
                {/* Card Action Menu: [ تعديل ✏️ | حذف المورد 🗑️ ] */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-bold transition-colors flex items-center gap-1"
                    title="تعديل المورد"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    <span>تعديل ✏️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-2 py-0.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded font-bold transition-colors flex items-center gap-1"
                    title="حذف المورد"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>حذف 🗑️</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  ${likecard.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  {likecard.env === 'production' ? 'Live Production' : 'Sandbox'}
                </span>
              </div>

              {/* Thresholds Quick Indicators */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>تنبيه أولي:</span>
                  <strong className="text-amber-400">${safety.earlyWarningThreshold}</strong>
                </div>
                <div className="text-slate-400 flex items-center justify-between">
                  <span>إيقاف حرج:</span>
                  <strong className="text-red-400">${safety.criticalThreshold}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* DUAL BALANCE THRESHOLDS & EMERGENCY MESSAGE (إرجاع الخانات)       */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>إعدادات الأمان وحدود الرصيد المزدوجة (Dual Thresholds & Emergency Message)</span>
            </h4>
            <span className="text-xs text-slate-400">تحكم فوري بحماية المتجر والزبائن</span>
          </div>

          {/* DUAL THRESHOLDS: Field 1 & Field 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field 1: حد التنبيه الأولي ($) */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>حد التنبيه الأولي ($) (Early Warning Threshold)</span>
                </label>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                  إشعار للإدارة
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                إرسال إشعار فوري عند هبوط رصيد المورد عن هذه القيمة لتنبيه الإدارة بضرورة الشحن المسبق.
              </p>
              <div className="relative flex items-center pt-1">
                <input
                  type="number"
                  step="1"
                  value={safety.earlyWarningThreshold}
                  onChange={e => handleUpdateEarlyThreshold(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                  placeholder="50"
                />
                <span className="absolute left-3 text-xs font-mono text-slate-400 pointer-events-none">$ USD</span>
              </div>
            </div>

            {/* Field 2: حد إيقاف البيع الحرج ($) */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>حد إيقاف البيع الحرج ($) (Critical Stop-Sales Threshold)</span>
                </label>
                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-bold">
                  إيقاف الشراء
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                إيقاف البيع في المتجر تلقائياً وتحويل الطلبات لوضع المعلق عند وصول الرصيد لهذا الحد لتفادي فشل العمليات.
              </p>
              <div className="relative flex items-center pt-1">
                <input
                  type="number"
                  step="1"
                  value={safety.criticalThreshold}
                  onChange={e => handleUpdateCriticalThreshold(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-red-400 focus:border-red-500 focus:outline-none"
                  placeholder="10"
                />
                <span className="absolute left-3 text-xs font-mono text-slate-400 pointer-events-none">$ USD</span>
              </div>
            </div>

          </div>

          {/* SAFETY TOGGLES: Toggle 1 & Toggle 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Toggle 1: الشحن التلقائي الفوري للطلبات */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white">الشحن التلقائي الفوري للطلبات (Auto-fulfillment)</span>
                  {safety.autoFulfill ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">نشط</span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold">يدوي</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  إرسال طلبات الشحن مباشرة إلى المورد عند إتمام الدفع دون انتظار موافقة الإدارة
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = !safety.autoFulfill;
                  setSafety(r => ({ ...r, autoFulfill: updated }));
                  showToast(updated ? '⚡ تم تفعيل الشحن التلقائي الفوري' : '🛑 تم تحويل جميع الطلبات للمراجعة اليدوية', updated ? 'success' : 'info');
                }}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  safety.autoFulfill ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <motion.div layout className="w-6 h-6 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>

            {/* Toggle 2: تفعيل إيقاف البيع التلقائي وإظهار الرسالة عند الحد الحرج */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white">تفعيل إيقاف البيع التلقائي وإظهار الرسالة عند الحد الحرج</span>
                  {safety.enableCriticalStop ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">حماية مفعلة</span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold">غير مفعلة</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  تجميد الشراء فوراً في المتجر وعرض رسالة التوقف للزبائن لحماية الحساب من استنزاف الرصيد
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = !safety.enableCriticalStop;
                  setSafety(r => ({ ...r, enableCriticalStop: updated }));
                  showToast(updated ? '🛡️ تم تفعيل الحماية وإيقاف البيع التلقائي' : '⚠️ تم تعطيل الحماية الوقائية', updated ? 'success' : 'info');
                }}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  safety.enableCriticalStop ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <motion.div layout className="w-6 h-6 rounded-full bg-slate-950 shadow-md" />
              </button>
            </div>

          </div>

          {/* Field 3: نص رسالة التوقف للزبائن (Storefront Emergency Message Area) */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>نص رسالة التوقف للزبائن (Storefront Emergency Message Area)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSafety(s => ({
                    ...s,
                    emergencyMessage: 'الخدمة متوقفة مؤقتاً لأغراض الصيانة والتحديث، يرجى المحاولة بعد قليل.'
                  }));
                  showToast('تمت استعادة النص الافتراضي');
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
              >
                استعادة النص الافتراضي
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              الرسالة التي ستظهر للمستخدمين في واجهة المتجر وشاشة إتمام الشراء عند تفعيل الإيقاف التلقائي.
            </p>

            <textarea
              rows={3}
              value={safety.emergencyMessage}
              onChange={e => setSafety(s => ({ ...s, emergencyMessage: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="اكتب رسالة التوقف للزبائن هنا..."
            />

            {/* Live Preview Box */}
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold ml-1">معاينة الرسالة في المتجر:</span>
                <span>{safety.emergencyMessage}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION B: سجل أخطاء وعمليات الشحن (Live API Dispatch Logs)        */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Header & Filter Controls: [ الكل | الناجحة ✅ | الفاشلة ❌ ] */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>سجل أخطاء وعمليات الشحن (Live API Dispatch Logs)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تتبع استجابات الموردين المباشرة، فك الأخطاء، وإعادة محاولة شحن الطلبات المعلقة
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLogsFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                logsFilterStatus === 'all' 
                  ? 'bg-slate-800 text-white font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({logs.length})
            </button>

            <button
              type="button"
              onClick={() => setLogsFilterStatus('success')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                logsFilterStatus === 'success' 
                  ? 'bg-emerald-500 text-slate-950 font-black' 
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span>الناجحة ✅</span>
              <span className="font-mono text-[10px]">({logs.filter(l => l.statusCode === 200).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setLogsFilterStatus('failed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                logsFilterStatus === 'failed' 
                  ? 'bg-red-500 text-white font-black' 
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <span>الفاشلة ❌</span>
              <span className="font-mono text-[10px]">({logs.filter(l => l.statusCode !== 200).length})</span>
            </button>
          </div>
        </div>

        {/* Logs Table: [ الوقت | رقم الطلب | حالة الشحن | زمن الاستجابة | الإجراءات ] */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">الوقت</th>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">حالة الشحن</th>
                <th className="p-4">زمن الاستجابة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map(log => {
                const isSuccess = log.statusCode === 200;
                const isRetrying = retryingLogId === log.id;

                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* 1. الوقت */}
                    <td className="p-4 font-mono text-slate-400 text-xs whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* 2. رقم الطلب */}
                    <td className="p-4">
                      <span className="font-bold text-amber-400 font-mono text-sm">{log.orderId}</span>
                      <div className="text-slate-300 text-xs font-medium">{log.serviceName}</div>
                      <div className="text-slate-500 text-[10px] font-mono mt-0.5">{log.supplier}</div>
                    </td>

                    {/* 3. حالة الشحن */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold font-mono text-xs ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{isSuccess ? 'تم الشحن بنجاح (200 OK)' : `فشل: ${log.statusText}`}</span>
                      </span>
                    </td>

                    {/* 4. زمن الاستجابة */}
                    <td className="p-4 font-mono text-slate-300">
                      {log.responseTime}
                    </td>

                    {/* 5. الإجراءات */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* عرض تفاصيل Request/Response */}
                        <button
                          type="button"
                          onClick={() => setSelectedLogForModal(log)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold transition-colors border border-slate-700 flex items-center gap-1.5 text-xs active:scale-95"
                          title="عرض بيانات Request / Response"
                        >
                          <FileCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>عرض تفاصيل Request/Response 🔍</span>
                        </button>

                        {/* إعادة إرسال الطلب الفاشل */}
                        {!isSuccess && (
                          <button
                            type="button"
                            disabled={isRetrying}
                            onClick={() => handleRetryApiLog(log.id)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md text-xs"
                            title="إعادة إرسال طلب الشحن إلى المورد"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span>{isRetrying ? 'جار الإرسال...' : 'إعادة إرسال الطلب الفاشل 🔁'}</span>
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    لا توجد سجلات تطابق الفلتر المحدد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: إضافة مورد جديد                                             */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 pt-16 sm:p-6 overflow-y-auto"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-right"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">إضافة مورد جديد (API Integration)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNewSupplier} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">اسم المورد (Supplier Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Razer Gold B2B API أو Codashop Direct"
                    value={newSupplierForm.name}
                    onChange={e => setNewSupplierForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الشارة التوضيحية</label>
                    <input
                      type="text"
                      placeholder="مثال: بطاقات ألعاب"
                      value={newSupplierForm.badge}
                      onChange={e => setNewSupplierForm(f => ({ ...f, badge: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">بيئة التشغيل</label>
                    <select
                      value={newSupplierForm.env}
                      onChange={e => setNewSupplierForm(f => ({ ...f, env: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="production">🚀 الوضع الحقيقي (Production)</option>
                      <option value="sandbox">🧪 وضع التجربة (Sandbox)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">معرف التاجر (Merchant ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: MERCHANT_RZ_44"
                    value={newSupplierForm.merchantId}
                    onChange={e => setNewSupplierForm(f => ({ ...f, merchantId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الرصيد المبدئي ($)</label>
                    <input
                      type="number"
                      value={newSupplierForm.balance}
                      onChange={e => setNewSupplierForm(f => ({ ...f, balance: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">حد التنبيه ($)</label>
                    <input
                      type="number"
                      value={newSupplierForm.lowBalanceAlert}
                      onChange={e => setNewSupplierForm(f => ({ ...f, lowBalanceAlert: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-amber-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">حد الإيقاف الحرج ($)</label>
                    <input
                      type="number"
                      value={newSupplierForm.criticalBalanceAlert}
                      onChange={e => setNewSupplierForm(f => ({ ...f, criticalBalanceAlert: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-red-400 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>إضافة المورد وحفظ</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: تعديل بيانات المورد                                         */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 pt-16 sm:p-6 overflow-y-auto"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-right"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">تعديل بيانات ({likecard.name})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">اسم المورد</label>
                  <input
                    type="text"
                    required
                    value={editSupplierForm.name}
                    onChange={e => setEditSupplierForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الشارة التوضيحية</label>
                    <input
                      type="text"
                      value={editSupplierForm.badge}
                      onChange={e => setEditSupplierForm(f => ({ ...f, badge: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">بيئة التشغيل</label>
                    <select
                      value={editSupplierForm.env}
                      onChange={e => setEditSupplierForm(f => ({ ...f, env: e.target.value as any }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="production">🚀 الوضع الحقيقي (Production)</option>
                      <option value="sandbox">🧪 وضع التجربة (Sandbox)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">معرف التاجر (Merchant ID)</label>
                  <input
                    type="text"
                    value={editSupplierForm.merchantId}
                    onChange={e => setEditSupplierForm(f => ({ ...f, merchantId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الرصيد المالي ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editSupplierForm.balance}
                      onChange={e => setEditSupplierForm(f => ({ ...f, balance: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">حد التنبيه الأولي ($)</label>
                    <input
                      type="number"
                      value={editSupplierForm.lowBalanceAlert}
                      onChange={e => setEditSupplierForm(f => ({ ...f, lowBalanceAlert: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-amber-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">حد الإيقاف الحرج ($)</label>
                    <input
                      type="number"
                      value={editSupplierForm.criticalBalanceAlert}
                      onChange={e => setEditSupplierForm(f => ({ ...f, criticalBalanceAlert: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-red-400 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: حذف المورد                                                  */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-right space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">هل أنت متأكد من حذف المورد؟</h3>
                <p className="text-xs text-slate-400">
                  سيتم إزالة بيانات <strong className="text-white">{likecard.name}</strong> من قائمة مزودي الخدمة.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSupplier}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-colors shadow-lg shadow-red-600/30"
                >
                  نعم، حذف المورد
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* JSON LOG INSPECTION MODAL                                          */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {selectedLogForModal && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 pt-16 sm:p-6 overflow-hidden"
            onClick={() => setSelectedLogForModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800 z-10">
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-base font-bold text-white">تفاصيل استدعاء الـ API</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedLogForModal.orderId} • {selectedLogForModal.endpoint}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLogForModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-right">
                {/* Request Payload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400">
                      بيانات الإرسال (Request Payload - {selectedLogForModal.method})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(JSON.stringify(selectedLogForModal.requestPayload, null, 2), 'Request Payload')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'Request Payload' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto text-left" dir="ltr">
                    {JSON.stringify(selectedLogForModal.requestPayload, null, 2)}
                  </pre>
                </div>

                {/* Response Payload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400">بيانات الاستجابة (Response Body)</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        selectedLogForModal.statusCode === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedLogForModal.statusText}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(JSON.stringify(selectedLogForModal.responsePayload, null, 2), 'Response Body')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'Response Body' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                  <pre className={`bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-left ${
                    selectedLogForModal.statusCode === 200 ? 'text-emerald-300' : 'text-red-300'
                  }`} dir="ltr">
                    {JSON.stringify(selectedLogForModal.responsePayload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  زمن المعالجة: <strong className="text-white font-mono">{selectedLogForModal.responseTime}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLogForModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
