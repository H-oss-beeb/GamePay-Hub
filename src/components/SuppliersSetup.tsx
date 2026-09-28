import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlugZap, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Save, 
  Search, 
  CheckCircle, 
  Layers, 
  ShieldCheck,
  PackageCheck,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Bell,
  X,
  Sliders,
  Wallet,
  Check,
  MessageSquare,
  ArrowDownToLine
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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
  lowBalanceAlert: number;      // حد التنبيه الأولي ($)
  criticalBalanceAlert: number; // حد إيقاف البيع الحرج ($)
  isConnected: boolean;
  latency?: string;
  lastChecked?: string;
}

export interface SafetySettings {
  autoFulfill: boolean;
  enableCriticalStop: boolean;
  earlyWarningThreshold: number;
  criticalThreshold: number;
  emergencyMessage: string;
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
  stockStatus?: 'available' | 'low_stock' | 'out_of_stock';
  availableCodesCount?: number;
  lastStockCheck?: string;
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

export default function SuppliersSetup() {
  const { 
    formatIQD, 
    exchangeRatePerUSD, 
    suppliers: globalSuppliers, 
    updateSupplier, 
    addSupplier: globalAddSupplier, 
    deleteSupplier: globalDeleteSupplier,
    packageMappings: globalMappings,
    updatePackageMapping: globalUpdateMapping,
    syncMappingsFromServices: globalSyncFromServices,
    addToast
  } = useApp();

  // 1. Suppliers List State (Cleaned: ONLY LikeCard or user-added suppliers, removing Custom / Direct)
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>(() => {
    const saved = localStorage.getItem('gamepay_suppliers_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out dummy suppliers: "Custom", "Direct"
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


  const [activeSupplierId, setActiveSupplierId] = useState<string>(() => {
    return suppliers[0]?.id || 'likecard';
  });

  const currentSupplier = suppliers.find(s => s.id === activeSupplierId) || suppliers[0] || DEFAULT_SUPPLIERS[0];

  // 2. Safety & Dual Balance Thresholds State
  const [safety, setSafety] = useState<SafetySettings>(() => {
    const saved = localStorage.getItem('gamepay_safety_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SAFETY_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_SAFETY_SETTINGS;
  });

  // Password / Secret toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // New Supplier Form State
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    badge: 'مورد معتمد',
    type: 'أكواد وبطاقات رقمية',
    merchantId: '',
    apiKey: '',
    apiSecret: '',
    env: 'production' as 'production' | 'sandbox',
    balance: 500,
    lowBalanceAlert: 50,
    criticalBalanceAlert: 10
  });

  // Edit Supplier Form State
  const [editSupplierForm, setEditSupplierForm] = useState({
    name: '',
    badge: '',
    type: '',
    merchantId: '',
    apiKey: '',
    apiSecret: '',
    env: 'production' as 'production' | 'sandbox',
    balance: 0,
    lowBalanceAlert: 50,
    criticalBalanceAlert: 10
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

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [checkingStockId, setCheckingStockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync suppliers to localStorage
  useEffect(() => {
    localStorage.setItem('gamepay_suppliers_config', JSON.stringify(suppliers));
  }, [suppliers]);

  // Sync safety settings to localStorage
  useEffect(() => {
    localStorage.setItem('gamepay_safety_settings', JSON.stringify(safety));
    // Also sync old rules key for backward compatibility
    localStorage.setItem('gamepay_fulfillment_rules', JSON.stringify({
      autoFulfill: safety.autoFulfill,
      stopOnLowBalance: safety.enableCriticalStop,
      earlyWarningThreshold: safety.earlyWarningThreshold,
      criticalThreshold: safety.criticalThreshold,
      emergencyMessage: safety.emergencyMessage
    }));
  }, [safety]);

  // Sync mappings to localStorage
  useEffect(() => {
    localStorage.setItem('gamepay_package_mapping', JSON.stringify(packageMappings));
  }, [packageMappings]);

  // Handler: Test Connection
  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      const ping = Math.floor(Math.random() * 55) + 90; // 90ms - 145ms
      setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? {
        ...s,
        isConnected: true,
        latency: `${ping}ms`,
        lastChecked: 'الآن'
      } : s));
      setIsTesting(false);
      showToast(`⚡ تم فحص الاتصال مع ${currentSupplier.name} بنجاح (${ping}ms)`);
    }, 1100);
  };

  // Handler: Save Supplier Keys
  const handleSaveKeys = () => {
    localStorage.setItem('gamepay_suppliers_config', JSON.stringify(suppliers));
    showToast(`💾 تم حفظ بيانات ومفاتيح الربط لـ ${currentSupplier.name} بنجاح`);
  };

  // Handler: Save Safety Settings
  const handleSaveSafetySettings = () => {
    localStorage.setItem('gamepay_safety_settings', JSON.stringify(safety));
    showToast('🛡️ تم حفظ معايير الأمان وحدود التنبيه ورسالة الطوارئ بنجاح');
  };

  // Handler: Update Mapping Product ID
  const handleUpdateProductId = (pkgId: string, newId: string) => {
    setPackageMappings(prev => prev.map(item => 
      item.packageId === pkgId ? { ...item, supplierProductId: newId } : item
    ));

    // Synchronize to services in localStorage
    const savedServices = localStorage.getItem('gamepay_services');
    if (savedServices) {
      try {
        const servicesList = JSON.parse(savedServices);
        const updated = servicesList.map((s: any) => ({
          ...s,
          packages: s.packages.map((p: any) => p.id === pkgId ? { ...p, likecardId: newId } : p)
        }));
        localStorage.setItem('gamepay_services', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Handler: Check Stock Simulation
  const handleCheckStock = (pkgId: string) => {
    setCheckingStockId(pkgId);
    setTimeout(() => {
      const count = Math.floor(Math.random() * 90) + 15;
      setPackageMappings(prev => prev.map(item => {
        if (item.packageId === pkgId) {
          return {
            ...item,
            stockStatus: 'available',
            availableCodesCount: count,
            lastStockCheck: 'مفحوص الآن'
          };
        }
        return item;
      }));
      setCheckingStockId(null);
      showToast(`📦 متوفر حالياً لدى المورد (${count} كود جاهز)`);
    }, 850);
  };

  // Open Edit Modal
  const handleOpenEditModal = () => {
    setEditSupplierForm({
      name: currentSupplier.name,
      badge: currentSupplier.badge,
      type: currentSupplier.type,
      merchantId: currentSupplier.merchantId,
      apiKey: currentSupplier.apiKey,
      apiSecret: currentSupplier.apiSecret,
      env: currentSupplier.env,
      balance: currentSupplier.balance,
      lowBalanceAlert: currentSupplier.lowBalanceAlert,
      criticalBalanceAlert: currentSupplier.criticalBalanceAlert
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Modal
  const handleSaveEditSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    setSuppliers(prev => prev.map(s => {
      if (s.id === currentSupplier.id) {
        return {
          ...s,
          name: editSupplierForm.name,
          badge: editSupplierForm.badge,
          type: editSupplierForm.type,
          merchantId: editSupplierForm.merchantId,
          apiKey: editSupplierForm.apiKey,
          apiSecret: editSupplierForm.apiSecret,
          env: editSupplierForm.env,
          balance: Number(editSupplierForm.balance),
          lowBalanceAlert: Number(editSupplierForm.lowBalanceAlert),
          criticalBalanceAlert: Number(editSupplierForm.criticalBalanceAlert)
        };
      }
      return s;
    }));
    setIsEditModalOpen(false);
    showToast('✏️ تم تحديث بيانات المورد بنجاح');
  };

  // Submit Add New Supplier
  const handleAddNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newSupplierForm?.name || '').trim()) {
      showToast('يرجى كتابة اسم المورد');
      return;
    }
    const newId = `sup_${Date.now()}`;
    const created: SupplierConfig = {
      id: newId,
      name: (newSupplierForm.name || '').trim(),
      badge: (newSupplierForm.badge || '').trim() || 'مورد إضافي',
      type: (newSupplierForm.type || '').trim() || 'شحن بطاقات وأكواد',
      merchantId: (newSupplierForm.merchantId || '').trim() || 'MERCHANT_NEW',
      apiKey: (newSupplierForm.apiKey || '').trim() || 'api_key_demo',
      apiSecret: (newSupplierForm.apiSecret || '').trim() || 'api_secret_demo',
      env: newSupplierForm.env,
      balance: Number(newSupplierForm.balance) || 500,
      lowBalanceAlert: Number(newSupplierForm.lowBalanceAlert) || 50,
      criticalBalanceAlert: Number(newSupplierForm.criticalBalanceAlert) || 10,
      isConnected: true,
      latency: '110ms',
      lastChecked: 'الآن'
    };

    setSuppliers(prev => [...prev, created]);
    setActiveSupplierId(newId);
    setIsAddModalOpen(false);
    setNewSupplierForm({
      name: '',
      badge: 'مورد معتمد',
      type: 'أكواد وبطاقات رقمية',
      merchantId: '',
      apiKey: '',
      apiSecret: '',
      env: 'production',
      balance: 500,
      lowBalanceAlert: 50,
      criticalBalanceAlert: 10
    });
    showToast(`✅ تم إضافة المورد الجديد "${created.name}" بنجاح`);
  };

  // Handle Delete Supplier
  const handleDeleteCurrentSupplier = () => {
    if (suppliers.length <= 1) {
      showToast('⚠️ لا يمكن حذف المورد الوحيد النشط!');
      setIsDeleteModalOpen(false);
      return;
    }
    const filtered = suppliers.filter(s => s.id !== currentSupplier.id);
    setSuppliers(filtered);
    setActiveSupplierId(filtered[0].id);
    setIsDeleteModalOpen(false);
    showToast(`🗑️ تم حذف المورد "${currentSupplier.name}"`);
  };

  // Filtered Mappings
  const filteredMappings = packageMappings.filter(m => 
    m.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.packageTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.supplierProductId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 text-slate-100 font-sans" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border backdrop-blur-xl bg-slate-900/95 text-amber-400 border-amber-500/50 shadow-amber-500/20"
          >
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP HEADER BAR: إعدادات الموردين وربط الباقات                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <PlugZap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إعدادات الموردين وربط الباقات</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إدارة مفاتيح الـ API لشركة لايك كارد وتحديد أكواد المنتجات (Product IDs)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Active Supplier Status Badge */}
          <span className="hidden md:flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentSupplier.name} Active</span>
          </span>

          {/* Top Action Button: + إضافة مورد جديد */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة مورد جديد</span>
          </button>
        </div>
      </div>

      {/* If there are multiple suppliers, allow fast switching */}
      {suppliers.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {suppliers.map(sup => (
            <button
              key={sup.id}
              type="button"
              onClick={() => setActiveSupplierId(sup.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                sup.id === activeSupplierId
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <span>{sup.name}</span>
              <span className="font-mono text-[10px] opacity-80">${sup.balance.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. COMPONENT 1: بطاقة بيانات الربط (LikeCard Credentials)          */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        
        {/* Card Header & Environment Switch: [ 🧪 وضع التجربة (Sandbox) | 🚀 الوضع الحقيقي (Production) ] */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-white">
                بيانات الربط مع {currentSupplier.name} ({currentSupplier.badge})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              أدخل المفاتيح البرمجية الرسمية لحسابك لدى بوابة {currentSupplier.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Environment Switch: [ 🧪 وضع التجربة (Sandbox) | 🚀 الوضع الحقيقي (Production) ] */}
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? { ...s, env: 'sandbox' } : s))}
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
                onClick={() => setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? { ...s, env: 'production' } : s))}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  currentSupplier.env === 'production'
                    ? 'bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🚀 الوضع الحقيقي (Production)</span>
              </button>
            </div>

            {suppliers.length > 1 && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-slate-800 transition-colors"
                title="حذف المورد"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Inputs: 3 clean fields */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Input 1: معرف التجاري (Merchant ID) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              معرف التجاري (Merchant ID)
            </label>
            <input
              type="text"
              value={currentSupplier.merchantId}
              onChange={e => setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? { ...s, merchantId: e.target.value } : s))}
              placeholder="مثال: MERCHANT_IQ_911"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Input 2: مفتاح الـ API (API Key) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              مفتاح الـ API (API Key)
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={currentSupplier.apiKey}
                onChange={e => setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? { ...s, apiKey: e.target.value } : s))}
                placeholder="lk_live_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-amber-400 focus:border-amber-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 text-slate-400 hover:text-white p-1"
                title={showApiKey ? 'إخفاء' : 'إظهار'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Input 3: الرمز السري (Hash Secret) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              الرمز السري (Hash Secret)
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiSecret ? 'text' : 'password'}
                value={currentSupplier.apiSecret}
                onChange={e => setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? { ...s, apiSecret: e.target.value } : s))}
                placeholder="sk_sec_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-xs font-mono text-slate-300 focus:border-amber-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute left-3 text-slate-400 hover:text-white p-1"
                title={showApiSecret ? 'إخفاء' : 'إظهار'}
              >
                {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Status & Actions: Response Time Badge & Buttons [ فحص الاتصال 🔄 | حفظ البيانات 💾 | تعديل المورد ✏️ ] */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Response Time Badge */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>حالة الاتصال:</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {currentSupplier.latency || '118ms'}
            </span>
            <span>• آخر فحص: {currentSupplier.lastChecked || 'الآن'}</span>
          </div>

          {/* Buttons: [ فحص الاتصال 🔄 | حفظ البيانات 💾 | تعديل المورد ✏️ ] */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isTesting ? 'جار فحص الاتصال...' : 'فحص الاتصال 🔄'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveKeys}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ البيانات 💾</span>
            </button>

            <button
              type="button"
              onClick={handleOpenEditModal}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-white border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل المورد ✏️</span>
            </button>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. COMPONENT 2: جدول ربط الباقات (Product ID Mapping)              */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Header & Quick Search */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>ربط باقات المتجر برقم المنتج عند المورد (Product ID Mapping)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              أدخل معرف كود الباقة المعتمد في لايك كارد ليتم إرساله آلياً عند تنفيذ الطلب
            </p>
          </div>

          {/* Search and Auto-Import Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                globalSyncFromServices();
                // refresh local view
                const savedMapping = localStorage.getItem('gamepay_package_mapping');
                if (savedMapping) {
                  try {
                    setPackageMappings(JSON.parse(savedMapping));
                  } catch(e) {}
                }
                showToast('🔄 تم استيراد ومزامنة كافة باقات الخدمات النشطة في المتجر تلقائياً!');
              }}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="مزامنة تلقائية واستيراد الباقات من الخدمات والأسعار"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>استيراد تلقائي للباقات ⚡️</span>
            </button>

            {/* Search input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث بالباقة أو كود المنتج..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table Container: Columns [ اسم الباقة بالمتجر | اسم المورد | رقم المنتج لدى المورد (Product ID) | سعر التكلفة | سعر البيع ($ / د.ع) | فحص المخزون ] */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">اسم الباقة بالمتجر</th>
                <th className="p-4">اسم المورد</th>
                <th className="p-4">رقم المنتج لدى المورد (Product ID)</th>
                <th className="p-4">سعر التكلفة</th>
                <th className="p-4">سعر البيع ($ / د.ع)</th>
                <th className="p-4 text-center">فحص المخزون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMappings.map(item => {
                const isCheckingStock = checkingStockId === item.packageId;

                return (
                  <tr key={item.packageId} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* 1. اسم الباقة بالمتجر */}
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{item.serviceName}</div>
                      <div className="text-amber-400 text-xs font-mono font-medium">{item.packageTitle}</div>
                    </td>

                    {/* 2. اسم المورد */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs">
                        {item.supplierName || currentSupplier.name}
                      </span>
                    </td>

                    {/* 3. رقم المنتج لدى المورد (Product ID) */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.supplierProductId}
                          onChange={e => handleUpdateProductId(item.packageId, e.target.value)}
                          className="w-32 bg-slate-950 border border-amber-500/40 text-amber-400 font-mono font-bold rounded-lg px-3 py-1.5 text-xs text-center focus:border-amber-400 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          placeholder="1042"
                        />
                      </div>
                    </td>

                    {/* 4. سعر التكلفة */}
                    <td className="p-4 font-mono text-slate-300 font-bold">
                      ${item.wholesaleCost.toFixed(2)}
                    </td>

                    {/* 5. سعر البيع */}
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      <div>${item.retailPrice.toFixed(2)}</div>
                      <div className="text-[10px] text-amber-400 font-normal">
                        ≈ {formatIQD(item.retailPrice).toLocaleString()} د.ع
                      </div>
                    </td>


                    {/* 6. فحص المخزون */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        disabled={isCheckingStock}
                        onClick={() => handleCheckStock(item.packageId)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold transition-colors border border-slate-700 flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50 active:scale-95 text-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStock ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                        <span>{isCheckingStock ? 'استعلام...' : 'فحص المخزون'}</span>
                      </button>
                    </td>

                  </tr>
                );
              })}

              {filteredMappings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا توجد باقات تطابق معايير البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: إضافة مورد جديد (ADD NEW SUPPLIER MODAL)                   */}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">مفتاح الـ API (API Key)</label>
                    <input
                      type="text"
                      placeholder="live_key_..."
                      value={newSupplierForm.apiKey}
                      onChange={e => setNewSupplierForm(f => ({ ...f, apiKey: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-amber-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الرمز السري (Secret Key)</label>
                    <input
                      type="password"
                      placeholder="sk_secret_..."
                      value={newSupplierForm.apiSecret}
                      onChange={e => setNewSupplierForm(f => ({ ...f, apiSecret: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
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
      {/* MODAL: تعديل المورد (EDIT SUPPLIER MODAL)                          */}
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
                  <h3 className="text-base font-bold text-white">تعديل بيانات المورد ({currentSupplier.name})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditSupplier} className="p-5 space-y-4 text-xs">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">مفتاح الـ API</label>
                    <input
                      type="text"
                      value={editSupplierForm.apiKey}
                      onChange={e => setEditSupplierForm(f => ({ ...f, apiKey: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-amber-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الرمز السري</label>
                    <input
                      type="text"
                      value={editSupplierForm.apiSecret}
                      onChange={e => setEditSupplierForm(f => ({ ...f, apiSecret: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
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
      {/* MODAL: تأكيد حذف المورد (DELETE CONFIRMATION MODAL)                 */}
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
                  سيتم إزالة بيانات الربط الخاصة بـ <strong className="text-white">{currentSupplier.name}</strong> ولن تتمكن من تنفيذ عمليات الشحن من خلاله حتى إعادة إضافته.
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
                  onClick={handleDeleteCurrentSupplier}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-colors shadow-lg shadow-red-600/30"
                >
                  نعم، حذف المورد
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
