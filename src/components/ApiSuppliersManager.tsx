import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlugZap, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Save, 
  Search, 
  Copy, 
  RotateCcw, 
  Activity, 
  Layers, 
  FileCode, 
  CheckCircle,
  X,
  ShieldCheck,
  Zap,
  Sliders,
  Check
} from 'lucide-react';
import { INITIAL_SERVICES_DATA } from './ProductsManager';

export interface SupplierConfig {
  id: string;
  name: string;
  badge: string;
  type: string;
  apiKey: string;
  apiSecret: string;
  merchantId: string;
  env: 'production' | 'sandbox';
  balance: number;
  lowBalanceAlert: number;
  isConnected: boolean;
  latency?: string;
  lastChecked?: string;
}

export interface FulfillmentRules {
  autoFulfill: boolean;
  stopOnLowBalance: boolean;
  failoverToManual: boolean;
  maxRetryAttempts: number;
}

export interface PackageMappingItem {
  packageId: string;
  serviceId: string;
  serviceName: string;
  packageTitle: string;
  supplierId: string;
  supplierName: string;
  supplierProductId: string;
  wholesaleCost: number;
  retailPrice: number;
  stockStatus?: 'available' | 'low_stock' | 'out_of_stock' | 'unknown';
  availableCodesCount?: number;
  lastStockCheck?: string;
}

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
    isConnected: true,
    latency: '118ms',
    lastChecked: 'الآن'
  },
  {
    id: 'smm_panel',
    name: 'Custom SMM Panel',
    badge: 'شحن مباشر للحساب',
    type: 'شحن الآيدي وتطوير الحسابات (Player ID Boost)',
    apiKey: 'smm_sec_5514a9382cd11099',
    apiSecret: 'hash_sha256_e10adc3949ba59',
    merchantId: 'SMM_GAMEPAY_PRO',
    env: 'production',
    balance: 340.20,
    lowBalanceAlert: 30.00,
    isConnected: true,
    latency: '165ms',
    lastChecked: 'منذ 5 دقائق'
  },
  {
    id: 'direct_gateway',
    name: 'Direct Gateway',
    badge: 'بوابة الاتصالات المباشرة',
    type: 'ربط مباشر بمزودي الخدمة (Direct Carrier Billing)',
    apiKey: 'aggr_sand_771923aa012bb',
    apiSecret: 'gw_auth_tok_882001934',
    merchantId: 'GATEWAY_ASYACELL_ZAIN',
    env: 'sandbox',
    balance: 890.00,
    lowBalanceAlert: 100.00,
    isConnected: true,
    latency: '92ms',
    lastChecked: 'منذ دقيقتين'
  }
];

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

export default function ApiSuppliersManager() {
  // 1. Suppliers State
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>(() => {
    const saved = localStorage.getItem('gamepay_suppliers_config');
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
  });

  // Selected supplier in Tab 1 (defaults to LikeCard)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('likecard');

  // Masks visibility state
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // 2. Fulfillment Automation Rules
  const [rules, setRules] = useState<FulfillmentRules>(() => {
    const saved = localStorage.getItem('gamepay_fulfillment_rules');
    return saved ? JSON.parse(saved) : {
      autoFulfill: true,
      stopOnLowBalance: true,
      failoverToManual: true,
      maxRetryAttempts: 3
    };
  });

  // 3. Package Mapping State
  const [packageMappings, setPackageMappings] = useState<PackageMappingItem[]>(() => {
    const savedMapping = localStorage.getItem('gamepay_package_mapping');
    if (savedMapping) {
      try {
        return JSON.parse(savedMapping);
      } catch (e) {}
    }

    let servicesList = INITIAL_SERVICES_DATA;
    const savedServices = localStorage.getItem('gamepay_services');
    if (savedServices) {
      try {
        servicesList = JSON.parse(savedServices);
      } catch (e) {}
    }

    const initialMap: PackageMappingItem[] = [];
    servicesList.forEach(s => {
      s.packages.forEach(p => {
        initialMap.push({
          packageId: p.id,
          serviceId: s.id,
          serviceName: s.name,
          packageTitle: p.title,
          supplierId: 'likecard',
          supplierName: 'LikeCard B2B API',
          supplierProductId: p.likecardId || '1042',
          wholesaleCost: p.wholesaleCost,
          retailPrice: p.retailPrice,
          stockStatus: 'available',
          availableCodesCount: Math.floor(Math.random() * 80) + 20,
          lastStockCheck: 'متاح'
        });
      });
    });
    return initialMap;
  });

  // 4. API Logs State
  const [logs, setLogs] = useState<ApiLogItem[]>(() => {
    const savedLogs = localStorage.getItem('gamepay_api_logs');
    return savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
  });

  // Main Sub-Tabs: Exactly 2 clean tabs
  // TAB 1: "ربط الموردين والباقات" (Integration & Product Mapping)
  // TAB 2: "عمليات الشحن والسجلات" (Live Operations & Logs)
  const [activeMainTab, setActiveMainTab] = useState<'integration' | 'operations'>('integration');

  // UI States
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'error' } | null>(null);
  const [testingSupplierId, setTestingSupplierId] = useState<string | null>(null);
  const [checkingStockId, setCheckingStockId] = useState<string | null>(null);
  const [selectedLogForModal, setSelectedLogForModal] = useState<ApiLogItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mappingSearchQuery, setMappingSearchQuery] = useState('');
  const [logsFilterStatus, setLogsFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('gamepay_suppliers_config', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('gamepay_fulfillment_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('gamepay_package_mapping', JSON.stringify(packageMappings));
  }, [packageMappings]);

  useEffect(() => {
    localStorage.setItem('gamepay_api_logs', JSON.stringify(logs));
  }, [logs]);

  // Current selected supplier for Tab 1
  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  // Handler: Update Supplier details
  const updateSupplierField = (id: string, field: keyof SupplierConfig, value: any) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Handler: Test Connection Simulation
  const handleTestConnection = (supplierId: string) => {
    setTestingSupplierId(supplierId);
    setTimeout(() => {
      const ping = Math.floor(Math.random() * 60) + 85; // 85ms - 145ms
      setSuppliers(prev => prev.map(s => {
        if (s.id === supplierId) {
          return {
            ...s,
            isConnected: true,
            latency: `${ping}ms`,
            lastChecked: 'الآن'
          };
        }
        return s;
      }));
      setTestingSupplierId(null);
      const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'لايك كارد';
      showToast(`⚡ تم فحص الاتصال مع ${supplierName} بنجاح (${ping}ms)`);
    }, 1100);
  };

  // Handler: Save Supplier Changes
  const handleSaveSupplierChanges = (supplierId: string) => {
    localStorage.setItem('gamepay_suppliers_config', JSON.stringify(suppliers));
    const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'المورد';
    showToast(`💾 تم حفظ بيانات الربط مع ${supplierName} بنجاح`);
  };

  // Handler: Update Package Mapping Product ID
  const handleUpdateMappingId = (pkgId: string, newSupplierProductId: string) => {
    setPackageMappings(prev => prev.map(item => 
      item.packageId === pkgId ? { ...item, supplierProductId: newSupplierProductId } : item
    ));

    // Synchronize back to gamepay_services so ProductsManager stays in sync
    const savedServices = localStorage.getItem('gamepay_services');
    if (savedServices) {
      try {
        const servicesList = JSON.parse(savedServices);
        const updated = servicesList.map((s: any) => ({
          ...s,
          packages: s.packages.map((p: any) => p.id === pkgId ? { ...p, likecardId: newSupplierProductId } : p)
        }));
        localStorage.setItem('gamepay_services', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Handler: Change Mapping Supplier
  const handleUpdateMappingSupplier = (pkgId: string, supplierId: string) => {
    const supp = suppliers.find(s => s.id === supplierId);
    setPackageMappings(prev => prev.map(item => 
      item.packageId === pkgId ? { 
        ...item, 
        supplierId, 
        supplierName: supp?.name || 'LikeCard B2B API' 
      } : item
    ));
    showToast('تم تحديث مزود الخدمة للباقة');
  };

  // Handler: Check Stock Simulation
  const handleCheckStock = (pkgId: string) => {
    setCheckingStockId(pkgId);
    setTimeout(() => {
      const randomCount = Math.floor(Math.random() * 95) + 12;
      setPackageMappings(prev => prev.map(item => {
        if (item.packageId === pkgId) {
          return {
            ...item,
            stockStatus: 'available',
            availableCodesCount: randomCount,
            lastStockCheck: 'مفحوص الآن'
          };
        }
        return item;
      }));
      setCheckingStockId(null);
      showToast(`📦 استجابة المورد: متوفر حالياً (${randomCount} كود جاهز)`);
    }, 900);
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
            statusText: '200 OK / Success',
            responseTime: '112ms',
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
      showToast('🔁 تمت إعادة إرسال الطلب بنجاح واكتمل الشحن التلقائي!');
    }, 1200);
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(`تم نسخ ${label} إلى الحافظة`);
  };

  // Filtered Mappings
  const filteredMappings = packageMappings.filter(m => 
    m.serviceName.toLowerCase().includes(mappingSearchQuery.toLowerCase()) ||
    m.packageTitle.toLowerCase().includes(mappingSearchQuery.toLowerCase()) ||
    m.supplierProductId.toLowerCase().includes(mappingSearchQuery.toLowerCase())
  );

  // Filtered Logs
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
      {/* 1. MAIN SUB-TABS NAVIGATION (2 DISTINCT CLEAN TABS)                */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2 backdrop-blur-xl shadow-xl">
        <button
          type="button"
          onClick={() => setActiveMainTab('integration')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
            activeMainTab === 'integration'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ربط الموردين والباقات</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
            activeMainTab === 'integration' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            {packageMappings.length} باقة
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('operations')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
            activeMainTab === 'operations'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>عمليات الشحن والسجلات</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
            activeMainTab === 'operations' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            {logs.length} عملية
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: ربط الموردين والباقات (SETUP & KEYS)                         */}
      {/* ------------------------------------------------------------------ */}
      {activeMainTab === 'integration' && (
        <div className="space-y-6">
          
          {/* A. Supplier Credentials Card (بطاقة بيانات المورد) */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            
            {/* Header & Quick Supplier Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <PlugZap className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-black text-white">
                    {currentSupplier.id === 'likecard' 
                      ? 'بيانات الربط مع لايك كارد (LikeCard Credentials)'
                      : `بيانات الربط مع ${currentSupplier.name}`
                    }
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  إعدادات مفاتيح الربط البرمجي وبيئة العمل وفحص استجابة المورد
                </p>
              </div>

              {/* Supplier Selection Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                {suppliers.map(sup => (
                  <button
                    key={sup.id}
                    type="button"
                    onClick={() => setSelectedSupplierId(sup.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      selectedSupplierId === sup.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sup.id === 'likecard' ? 'لايك كارد (الرئيسي)' : sup.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Environment Toggle & Status */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-300">بيئة تشغيل الـ API:</span>
                <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => updateSupplierField(currentSupplier.id, 'env', 'sandbox')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      currentSupplier.env === 'sandbox'
                        ? 'bg-amber-500/20 text-amber-400 font-black border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🧪 وضع التجربة (Sandbox)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSupplierField(currentSupplier.id, 'env', 'production')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      currentSupplier.env === 'production'
                        ? 'bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🚀 الوضع الحقيقي (Live)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">زمن الاستجابة:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {currentSupplier.latency || '118ms'}
                </span>
                <span className="text-slate-400">آخر فحص: {currentSupplier.lastChecked || 'الآن'}</span>
              </div>
            </div>

            {/* Clean Inputs Grid */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Merchant ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  معرف التجاري (Merchant ID)
                </label>
                <input
                  type="text"
                  value={currentSupplier.merchantId}
                  onChange={e => updateSupplierField(currentSupplier.id, 'merchantId', e.target.value)}
                  placeholder="مثال: MERCHANT_IQ_911"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 2. API Key */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مفتاح الـ API (API Key)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey[currentSupplier.id] ? 'text' : 'password'}
                    value={currentSupplier.apiKey}
                    onChange={e => updateSupplierField(currentSupplier.id, 'apiKey', e.target.value)}
                    placeholder="lk_live_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-amber-400 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(prev => ({ ...prev, [currentSupplier.id]: !prev[currentSupplier.id] }))}
                    className="absolute left-3 text-slate-400 hover:text-white p-1"
                    title={showKey[currentSupplier.id] ? 'إخفاء' : 'إظهار'}
                  >
                    {showKey[currentSupplier.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3. Hash Secret */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الرمز السري (Hash Secret)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSecret[currentSupplier.id] ? 'text' : 'password'}
                    value={currentSupplier.apiSecret}
                    onChange={e => updateSupplierField(currentSupplier.id, 'apiSecret', e.target.value)}
                    placeholder="sk_sec_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-slate-300 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(prev => ({ ...prev, [currentSupplier.id]: !prev[currentSupplier.id] }))}
                    className="absolute left-3 text-slate-400 hover:text-white p-1"
                    title={showSecret[currentSupplier.id] ? 'إخفاء' : 'إظهار'}
                  >
                    {showSecret[currentSupplier.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 4. Threshold Alert */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  تنبيه عند انخفاض الرصيد عن ($)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={currentSupplier.lowBalanceAlert}
                    onChange={e => updateSupplierField(currentSupplier.id, 'lowBalanceAlert', Number(e.target.value))}
                    placeholder="50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute left-3 text-xs font-mono text-slate-400 pointer-events-none">$ USD</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                disabled={testingSupplierId === currentSupplier.id}
                onClick={() => handleTestConnection(currentSupplier.id)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${testingSupplierId === currentSupplier.id ? 'animate-spin text-amber-400' : ''}`} />
                <span>{testingSupplierId === currentSupplier.id ? 'جار فحص الاستجابة...' : 'فحص الاتصال بالمورد 🔄'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSupplierChanges(currentSupplier.id)}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>حفظ البيانات 💾</span>
              </button>
            </div>

          </div>

          {/* B. Product Mapping Table (جدول ربط الباقات) */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Header & Search */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>ربط باقات المتجر برقم المنتج عند المورد (Product ID Mapping)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حدد رقم المنتج (Product ID) لدى المورد لكل باقة لضمان الشحن الفوري عند الدفع
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mappingSearchQuery}
                  onChange={e => setMappingSearchQuery(e.target.value)}
                  placeholder="بحث باسم الباقة أو الكود..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">اسم الباقة في متجرك</th>
                    <th className="p-4">اسم المورد</th>
                    <th className="p-4">رقم المنتج عند المورد (Product ID)</th>
                    <th className="p-4">سعر التكلفة</th>
                    <th className="p-4">سعر البيع</th>
                    <th className="p-4 text-center">فحص المخزون</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMappings.map(item => {
                    const isCheckingStock = checkingStockId === item.packageId;

                    return (
                      <tr key={item.packageId} className="hover:bg-slate-800/30 transition-colors">
                        {/* 1. اسم الباقة في متجرك */}
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{item.serviceName}</div>
                          <div className="text-amber-400 text-xs font-mono font-medium">{item.packageTitle}</div>
                        </td>

                        {/* 2. اسم المورد */}
                        <td className="p-4">
                          <select
                            value={item.supplierId}
                            onChange={e => handleUpdateMappingSupplier(item.packageId, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                          >
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* 3. رقم المنتج عند المورد (Product ID) */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.supplierProductId}
                              onChange={e => handleUpdateMappingId(item.packageId, e.target.value)}
                              className="w-28 bg-slate-950 border border-amber-500/40 text-amber-400 font-mono font-bold rounded-lg px-2.5 py-1.5 text-xs text-center focus:border-amber-400 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              placeholder="مثال: 1042"
                            />
                          </div>
                        </td>

                        {/* 4. سعر التكلفة */}
                        <td className="p-4 font-mono text-slate-300">
                          ${item.wholesaleCost.toFixed(2)}
                        </td>

                        {/* 5. سعر البيع */}
                        <td className="p-4 font-mono font-bold text-emerald-400">
                          ${item.retailPrice.toFixed(2)}
                        </td>

                        {/* 6. فحص المخزون */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            disabled={isCheckingStock}
                            onClick={() => handleCheckStock(item.packageId)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50 active:scale-95 text-xs"
                            title="فحص توفر الأكواد فورياً من المورد"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStock ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                            <span>{isCheckingStock ? 'جار الفحص...' : 'فحص المخزون'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: عمليات الشحن والسجلات (MONITORING & LOGS)                   */}
      {/* ------------------------------------------------------------------ */}
      {activeMainTab === 'operations' && (
        <div className="space-y-6">
          
          {/* A. Top Overview & Automation Rules (الرصيد وقواعد الشحن) */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            
            {/* Live Balance Badges */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <PlugZap className="w-5 h-5 text-amber-500" />
                    <span>رصيد الموردين المباشر (Live Supplier Balances)</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  مراقبة فورية لأرصدة محافظ الموردين لتفادي توقف الشحن الآلي
                </p>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                {suppliers.map(sup => {
                  const isLow = sup.balance <= sup.lowBalanceAlert;
                  return (
                    <div 
                      key={sup.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between min-w-[175px] transition-all ${
                        isLow 
                          ? 'bg-red-500/10 border-red-500/40 text-red-300' 
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-white truncate">{sup.name.split(' ')[0]}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          sup.env === 'production' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {sup.env === 'production' ? 'Live' : 'Sandbox'}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="text-xl font-black text-white font-mono">
                          ${sup.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          تنبيه &lt; ${sup.lowBalanceAlert}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Automation Toggles */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Toggle 1: الشحن التلقائي الفوري للزبائن */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">الشحن التلقائي الفوري للزبائن</span>
                    {rules.autoFulfill ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">نشط</span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold">معطل (يدوي)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    إرسال الطلب آلياً للمورد فور الدفع دون انتظار موافقة الإدمن
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = !rules.autoFulfill;
                    setRules(r => ({ ...r, autoFulfill: updated }));
                    showToast(updated ? '⚡ تم تفعيل الشحن التلقائي الفوري' : '🛑 تم إيقاف الشحن التلقائي والتحويل للمراجعة اليدوية', updated ? 'success' : 'info');
                  }}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    rules.autoFulfill ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <motion.div layout className="w-6 h-6 rounded-full bg-slate-950 shadow-md" />
                </button>
              </div>

              {/* Toggle 2: الحماية عند نقص الرصيد */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">الحماية عند نقص الرصيد</span>
                    {rules.stopOnLowBalance ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold">حماية مفعلة</span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold">غير مفعلة</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    تحويل الطلبات للتحقيق اليدوي إذا قل رصيد المورد عن حد التنبيه
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = !rules.stopOnLowBalance;
                    setRules(r => ({ ...r, stopOnLowBalance: updated }));
                    showToast(updated ? '🛡️ تم تفعيل الحماية عند نقص الرصيد' : '⚠️ تم تعطيل الحماية الوقائية', updated ? 'success' : 'info');
                  }}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    rules.stopOnLowBalance ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <motion.div layout className="w-6 h-6 rounded-full bg-slate-950 shadow-md" />
                </button>
              </div>

            </div>

          </div>

          {/* B. Live API Logs (سجل حركة الشحن المباشرة) */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Header & Filter Tabs: [ الكل | الناجحة ✅ | الفاشلة ❌ ] */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>سجل حركة الشحن المباشرة (Live API Logs)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  مراقبة طلبات الشحن الصادرة للموردين في الوقت الفعلي مع إمكانية إعادة المحاولة
                </p>
              </div>

              {/* Filter Tabs */}
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

            {/* Log Table: [ الوقت | رقم الطلب | حالة الشحن | زمن الاستجابة | الإجراءات ] */}
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
                            
                            {/* تفاصيل الخطأ / عرض التفاصيل */}
                            <button
                              type="button"
                              onClick={() => setSelectedLogForModal(log)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold transition-colors border border-slate-700 flex items-center gap-1.5 text-xs active:scale-95"
                              title="عرض بيانات الـ Request والـ Response بالكامل"
                            >
                              <FileCode className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isSuccess ? 'عرض التفاصيل 🔍' : 'تفاصيل الخطأ 🔍'}</span>
                            </button>

                            {/* إعادة إرسال الطلب (For failed orders) */}
                            {!isSuccess && (
                              <button
                                type="button"
                                disabled={isRetrying}
                                onClick={() => handleRetryApiLog(log.id)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md text-xs"
                                title="إعادة محاولة إرسال الطلب للمورد فوراً"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                                <span>{isRetrying ? 'جار الإرسال...' : 'إعادة إرسال الطلب 🔁'}</span>
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

        </div>
      )}

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
              {/* Sticky Modal Header */}
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

              {/* Scrollable JSON Body */}
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

              {/* Fixed Footer */}
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
