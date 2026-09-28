import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  DailyArchiveRecord, 
  getStoredFinancialArchives, 
  recordOrderToDailyFinancialArchive, 
  generateZeroed30DaysArchive,
  ItemizedSale 
} from '../utils/financialArchiveSync';
import { SupplierConfig, SafetySettings, PackageMappingItem } from '../components/SuppliersSetup';
import { INITIAL_SERVICES_DATA } from '../components/ProductsManager';
import { SystemSettingsData } from '../components/SystemSettings';
import { ApiLogItem } from '../components/FulfillmentLogs';

// --------------------------------------------------------------------------
// Default Constants
// --------------------------------------------------------------------------
export const DEFAULT_EXCHANGE_RATE_STR = '150,000'; // 100 USD = 150,000 IQD -> 1 USD = 1,500 IQD

export function parseExchangeRate(exchangeRateStr: string): number {
  if (!exchangeRateStr) return 1500;
  // Remove commas, spaces, currency symbols
  const clean = exchangeRateStr.replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return 1500;
  // If user entered 150,000 (meaning 100 USD = 150,000 IQD), 1 USD = 150000 / 100 = 1500
  if (num > 10000) {
    return num / 100;
  }
  // If user entered already per-dollar rate e.g. 1500
  return num;
}

export interface GlobalToast {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'error' | 'warning';
}

interface AppContextType {
  // 1. Settings & Exchange Rate
  settings: SystemSettingsData;
  updateSettings: (newSettings: Partial<SystemSettingsData>) => void;
  exchangeRatePerUSD: number;
  formatIQD: (usdAmount: number) => number;

  // 2. Suppliers State
  suppliers: SupplierConfig[];
  updateSupplier: (supplierId: string, updates: Partial<SupplierConfig>) => void;
  addSupplier: (supplier: SupplierConfig) => void;
  deleteSupplier: (supplierId: string) => void;

  // 3. Safety & Maintenance
  safety: SafetySettings;
  updateSafety: (updates: Partial<SafetySettings>) => void;

  // 4. Products & Mapping
  services: any[];
  updateServices: (newServices: any[]) => void;
  packageMappings: PackageMappingItem[];
  updatePackageMappings: (newMappings: PackageMappingItem[]) => void;
  importSupplierPackageToCatalog: (mappingItem: PackageMappingItem, marginUSD: number) => void;

  // 5. Orders & Financial Archives
  orders: any[];
  dispatchNewOrder: (orderData: {
    serviceName: string;
    packageTier: string;
    wholesaleCost?: number;
    retailPrice?: number;
    totalAmount?: number;
    playerId: string;
    paymentMethod: string;
  }) => Promise<{ success: boolean; orderId?: string; voucherCode?: string; error?: string }>;

  financialArchives: DailyArchiveRecord[];
  refreshFinancials: () => void;
  wipeAllFinancialAndLogData: () => void;

  // 6. Fulfillment Logs
  apiLogs: ApiLogItem[];
  addApiLog: (log: Omit<ApiLogItem, 'id'>) => void;

  // 7. Global Toasts (Unified Z-Index [9999] Singleton System)
  toasts: GlobalToast[];
  addToast: (toast: Omit<GlobalToast, 'id'> & { id?: string }, options?: { id?: string; duration?: number }) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ------------------------------------------------------------------------
  // 1. System Settings State
  // ------------------------------------------------------------------------
  const [settings, setSettingsState] = useState<SystemSettingsData>(() => {
    try {
      const saved = localStorage.getItem('gamepay_system_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      likeCardApiKey: 'LC_LIVE_9921804f83b2c9a17',
      enableSmmPanel: false,
      smmPanelApiKey: 'smm_live_41a80d7c55e2f094',
      enableEmailJs: false,
      emailJsServiceId: 'service_gamepay_v2',
      emailJsTemplateId: 'template_order_receipt',
      emailJsPublicKey: 'pub_key_38402f1a9c7',
      exchangeRate100USD: DEFAULT_EXCHANGE_RATE_STR,
      supportTelegram: 'https://t.me/gamepay_support',
      maintenanceMode: false,
      maintenanceMessage: 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
    };
  });

  const exchangeRatePerUSD = parseExchangeRate(settings.exchangeRate100USD);

  const formatIQD = useCallback((usdAmount: number): number => {
    return Math.round(usdAmount * exchangeRatePerUSD);
  }, [exchangeRatePerUSD]);

  const updateSettings = useCallback((newSettings: Partial<SystemSettingsData>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('gamepay_system_settings', JSON.stringify(updated));
      localStorage.setItem('gamepay_maintenance_mode', String(updated.maintenanceMode));
      localStorage.setItem('gamepay_is_maintenance_mode', String(updated.maintenanceMode));
      if (updated.maintenanceMessage) {
        localStorage.setItem('gamepay_maintenance_message', updated.maintenanceMessage);
      }
      window.dispatchEvent(new CustomEvent('gamepay_settings_updated', { detail: updated }));
      return updated;
    });
  }, []);

  // ------------------------------------------------------------------------
  // 2. Suppliers Configuration
  // ------------------------------------------------------------------------
  const [suppliers, setSuppliersState] = useState<SupplierConfig[]>(() => {
    try {
      const saved = localStorage.getItem('gamepay_suppliers_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [
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
  });

  const updateSupplier = useCallback((supplierId: string, updates: Partial<SupplierConfig>) => {
    setSuppliersState(prev => {
      const next = prev.map(s => s.id === supplierId ? { ...s, ...updates } : s);
      localStorage.setItem('gamepay_suppliers_config', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('gamepay_suppliers_updated', { detail: next }));
      return next;
    });
  }, []);

  const addSupplier = useCallback((supplier: SupplierConfig) => {
    setSuppliersState(prev => {
      const next = [...prev, supplier];
      localStorage.setItem('gamepay_suppliers_config', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('gamepay_suppliers_updated', { detail: next }));
      return next;
    });
  }, []);

  const deleteSupplier = useCallback((supplierId: string) => {
    setSuppliersState(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(s => s.id !== supplierId);
      localStorage.setItem('gamepay_suppliers_config', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('gamepay_suppliers_updated', { detail: next }));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------------
  // 3. Safety & Maintenance Settings
  // ------------------------------------------------------------------------
  const [safety, setSafetyState] = useState<SafetySettings>(() => {
    try {
      const saved = localStorage.getItem('gamepay_safety_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      autoFulfill: true,
      enableCriticalStop: true,
      earlyWarningThreshold: 50.00,
      criticalThreshold: 10.00,
      emergencyMessage: 'الخدمة متوقفة مؤقتاً لأغراض الصيانة والتحديث، يرجى المحاولة بعد قليل.'
    };
  });

  const updateSafety = useCallback((updates: Partial<SafetySettings>) => {
    setSafetyState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('gamepay_safety_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------------
  // 4. Products & Catalog
  // ------------------------------------------------------------------------
  const [services, setServicesState] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('gamepay_services');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SERVICES_DATA;
  });

  const updateServices = useCallback((newServices: any[]) => {
    setServicesState(newServices);
    localStorage.setItem('gamepay_services', JSON.stringify(newServices));
    const statusMap = newServices.reduce((acc, s) => ({ ...acc, [s.name]: s.isActive }), {});
    localStorage.setItem('gamepay_services_status', JSON.stringify(statusMap));
    window.dispatchEvent(new Event('gamepay_services_updated'));
  }, []);

  // Package Mappings
  const [packageMappings, setPackageMappingsState] = useState<PackageMappingItem[]>(() => {
    try {
      const saved = localStorage.getItem('gamepay_package_mapping');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const initialMap: PackageMappingItem[] = [];
    INITIAL_SERVICES_DATA.forEach(s => {
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

  const updatePackageMappings = useCallback((newMappings: PackageMappingItem[]) => {
    setPackageMappingsState(newMappings);
    localStorage.setItem('gamepay_package_mapping', JSON.stringify(newMappings));
    window.dispatchEvent(new Event('gamepay_mapping_updated'));
  }, []);

  // Pipeline: Auto-import supplier package into products catalog
  const importSupplierPackageToCatalog = useCallback((item: PackageMappingItem, marginUSD: number) => {
    const retailCalculated = Number((item.wholesaleCost + marginUSD).toFixed(2));

    setServicesState(prev => {
      const targetServiceIndex = prev.findIndex(s => (s?.name || '').trim().toLowerCase() === (item?.serviceName || '').trim().toLowerCase());
      let nextServices = [...prev];

      if (targetServiceIndex !== -1) {
        const s = nextServices[targetServiceIndex];
        const existingPkgIndex = s.packages.findIndex((p: any) => (p?.title || '').trim().toLowerCase() === (item?.packageTitle || '').trim().toLowerCase());
        
        if (existingPkgIndex !== -1) {
          const updatedPackages = [...s.packages];
          updatedPackages[existingPkgIndex] = {
            ...updatedPackages[existingPkgIndex],
            likecardId: item.supplierProductId,
            wholesaleCost: item.wholesaleCost,
            retailPrice: retailCalculated
          };
          nextServices[targetServiceIndex] = { ...s, packages: updatedPackages };
        } else {
          nextServices[targetServiceIndex] = {
            ...s,
            packages: [
              ...s.packages,
              {
                id: item.packageId || `pkg_${Date.now()}`,
                title: item.packageTitle,
                likecardId: item.supplierProductId,
                wholesaleCost: item.wholesaleCost,
                retailPrice: retailCalculated
              }
            ]
          };
        }
      }

      localStorage.setItem('gamepay_services', JSON.stringify(nextServices));
      window.dispatchEvent(new Event('gamepay_services_updated'));
      return nextServices;
    });

    // Update mapping item retail price
    setPackageMappingsState(prev => {
      const next = prev.map(m => m.packageId === item.packageId ? { ...m, retailPrice: retailCalculated } : m);
      localStorage.setItem('gamepay_package_mapping', JSON.stringify(next));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------------
  // 5. Orders & Financial Archives
  // ------------------------------------------------------------------------
  const [orders, setOrdersState] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('gamepay_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {}
    return [];
  });

  const [financialArchives, setFinancialArchivesState] = useState<DailyArchiveRecord[]>(() => {
    return getStoredFinancialArchives();
  });

  const refreshFinancials = useCallback(() => {
    setFinancialArchivesState(getStoredFinancialArchives());
  }, []);

  const wipeAllFinancialAndLogData = useCallback(() => {
    const zeroed = generateZeroed30DaysArchive();
    setFinancialArchivesState(zeroed);
    setOrdersState([]);
    setApiLogsState([]);

    // Clear and reset local storage records
    localStorage.setItem('gamepay_financial_archives_v2', JSON.stringify(zeroed));
    localStorage.setItem('gamepay_orders', JSON.stringify([]));
    localStorage.setItem('gamepay_api_logs', JSON.stringify([]));
    localStorage.removeItem('gamepay_orders');
    localStorage.removeItem('gamepay_api_logs');
    localStorage.removeItem('gamepay_orders_list');

    // Broadcast across windows
    window.dispatchEvent(new Event('gamepay_financial_updated'));
    window.dispatchEvent(new Event('orders_updated'));
    window.dispatchEvent(new Event('gamepay_orders_updated'));
    window.dispatchEvent(new Event('gamepay_api_logs_updated'));
    window.dispatchEvent(new Event('storage'));
  }, []);

  // ------------------------------------------------------------------------
  // 6. Fulfillment Logs
  // ------------------------------------------------------------------------
  const [apiLogs, setApiLogsState] = useState<ApiLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('gamepay_api_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const addApiLog = useCallback((logData: Omit<ApiLogItem, 'id'>) => {
    const newLog: ApiLogItem = {
      ...logData,
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    setApiLogsState(prev => {
      const next = [newLog, ...prev.slice(0, 99)]; // Keep latest 100 logs
      localStorage.setItem('gamepay_api_logs', JSON.stringify(next));
      window.dispatchEvent(new Event('gamepay_api_logs_updated'));
      return next;
    });
  }, []);

  // ------------------------------------------------------------------------
  // 7. Global Toasts (z-[9999] Singleton Toast System)
  // ------------------------------------------------------------------------
  const [toasts, setToasts] = useState<GlobalToast[]>([]);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    toastTimersRef.current.forEach(timer => clearTimeout(timer));
    toastTimersRef.current.clear();
    setToasts([]);
  }, []);

  const addToast = useCallback((
    toast: Omit<GlobalToast, 'id'> & { id?: string },
    options?: { id?: string; duration?: number }
  ) => {
    const targetId = options?.id || toast.id || `toast_${Date.now()}`;
    const duration = options?.duration || 3200;

    setTimeout(() => {
      // Clear any pending timers for old toasts since we enforce max 1 visible toast (singleton)
      toastTimersRef.current.forEach(timer => clearTimeout(timer));
      toastTimersRef.current.clear();

      const newToastItem: GlobalToast = {
        id: targetId,
        title: toast.title,
        message: toast.message,
        type: toast.type || 'success'
      };

      // Set singleton toast: immediately replace any active toast instead of stacking
      setToasts([newToastItem]);

      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== targetId));
        toastTimersRef.current.delete(targetId);
      }, duration);

      toastTimersRef.current.set(targetId, timer);
    }, 0);
  }, []);

  // ------------------------------------------------------------------------
  // Order Lifecycle & Dispatch Execution Pipeline
  // ------------------------------------------------------------------------
  const dispatchNewOrder = useCallback(async (orderData: {
    serviceName: string;
    packageTier: string;
    wholesaleCost?: number;
    retailPrice?: number;
    totalAmount?: number;
    playerId: string;
    paymentMethod: string;
  }): Promise<{ success: boolean; orderId?: string; voucherCode?: string; error?: string }> => {
    const activeSupplier = suppliers.find(s => s.id === 'likecard') || suppliers[0];

    // 1. Critical Stop & Safety Checks
    if (safety.enableCriticalStop && activeSupplier && activeSupplier.balance <= safety.criticalThreshold) {
      const errorMsg = safety.emergencyMessage || 'رصيد التوريد منخفض جداً وتم إيقاف البيع لحماية العمليات.';
      addToast({
        title: 'إيقاف البيع التلقائي',
        message: errorMsg,
        type: 'error'
      });
      return { success: false, error: errorMsg };
    }

    // Lookup package details
    let wholesale = orderData.wholesaleCost;
    let retail = orderData.retailPrice;

    if (wholesale === undefined || retail === undefined) {
      const targetServiceName = (orderData?.serviceName || '').trim().toLowerCase();
      const targetPkgTier = (orderData?.packageTier || '').trim().toLowerCase();
      const mapping = packageMappings.find(
        m => (m?.serviceName || '').trim().toLowerCase() === targetServiceName &&
             (m?.packageTitle || '').trim().toLowerCase() === targetPkgTier
      );
      if (mapping) {
        wholesale = mapping.wholesaleCost;
        retail = mapping.retailPrice;
      } else {
        wholesale = wholesale || 1.00;
        retail = retail || (orderData.totalAmount ? Number((orderData.totalAmount / exchangeRatePerUSD).toFixed(2)) : 1.50);
      }
    }

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = now.toLocaleString('ar-IQ');
    const voucherCode = `GP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 2. Deduct wholesale cost from supplier balance
    const updatedBalance = Number(Math.max(0, (activeSupplier?.balance || 500) - (wholesale || 1.00)).toFixed(2));
    if (activeSupplier) {
      updateSupplier(activeSupplier.id, { balance: updatedBalance });
    }

    // 3. Decrement available stock count in mapping
    setPackageMappingsState(prev => {
      const targetServiceName = (orderData?.serviceName || '').trim().toLowerCase();
      const targetPkgTier = (orderData?.packageTier || '').trim().toLowerCase();
      const next = prev.map(m => {
        if ((m?.serviceName || '').trim().toLowerCase() === targetServiceName &&
            (m?.packageTitle || '').trim().toLowerCase() === targetPkgTier) {
          const newCount = Math.max(0, (m.availableCodesCount || 20) - 1);
          return {
            ...m,
            availableCodesCount: newCount,
            stockStatus: newCount <= 5 ? (newCount === 0 ? 'out_of_stock' : 'low_stock') : 'available',
            lastStockCheck: 'مفحوص الآن'
          };
        }
        return m;
      });
      localStorage.setItem('gamepay_package_mapping', JSON.stringify(next));
      return next;
    });

    // 4. Create Order Record
    const newOrder = {
      id: orderId,
      serviceName: orderData.serviceName,
      packageTier: orderData.packageTier,
      wholesaleCost: wholesale,
      retailPrice: retail,
      playerId: orderData.playerId,
      paymentMethod: orderData.paymentMethod,
      totalAmount: orderData.totalAmount || Math.round((retail || 1) * exchangeRatePerUSD),
      date: dateStr,
      timestamp: Date.now(),
      status: 'مكتمل',
      voucherCode
    };

    // Save to Orders List
    setOrdersState(prev => {
      const next = [newOrder, ...prev];
      localStorage.setItem('gamepay_orders', JSON.stringify(next));
      return next;
    });

    // 5. Save to Daily Financial Archives
    recordOrderToDailyFinancialArchive(newOrder);
    setFinancialArchivesState(getStoredFinancialArchives());

    // 6. Record API Log with dynamic settings API key
    const apiKeyUsed = settings.likeCardApiKey || activeSupplier?.apiKey || 'LC_LIVE_9921804f83b2c9a17';
    addApiLog({
      timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
      orderId: `#${orderId}`,
      serviceName: orderData.serviceName,
      supplier: activeSupplier?.name || 'LikeCard B2B API',
      endpoint: '/api/v1/orders/create',
      method: 'POST',
      statusCode: 200,
      statusText: '200 OK / Success',
      responseTime: `${Math.floor(Math.random() * 40) + 85}ms`,
      requestPayload: {
        api_key: apiKeyUsed.slice(0, 8) + '...',
        merchant_id: activeSupplier?.merchantId || 'MERCHANT_IQ_911',
        product_title: orderData.packageTier,
        player_id: orderData.playerId,
        quantity: 1
      },
      responsePayload: {
        status: 'success',
        order_reference: orderId,
        voucher_code: voucherCode,
        fulfilled_at: now.toISOString()
      }
    });

    // Broadcast across windows
    window.dispatchEvent(new Event('orders_updated'));
    window.dispatchEvent(new Event('gamepay_orders_updated'));
    window.dispatchEvent(new Event('gamepay_financial_updated'));

    return { success: true, orderId, voucherCode };
  }, [suppliers, safety, packageMappings, exchangeRatePerUSD, settings.likeCardApiKey, updateSupplier, addApiLog, addToast]);

  // Storage listener across tabs/windows
  useEffect(() => {
    let timeoutId: any = null;
    const handleSync = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          const savedSettings = localStorage.getItem('gamepay_system_settings');
          if (savedSettings) setSettingsState(JSON.parse(savedSettings));

          const savedSuppliers = localStorage.getItem('gamepay_suppliers_config');
          if (savedSuppliers) setSuppliersState(JSON.parse(savedSuppliers));

          const savedSafety = localStorage.getItem('gamepay_safety_settings');
          if (savedSafety) setSafetyState(JSON.parse(savedSafety));

          const savedServices = localStorage.getItem('gamepay_services');
          if (savedServices) setServicesState(JSON.parse(savedServices));

          const savedMappings = localStorage.getItem('gamepay_package_mapping');
          if (savedMappings) setPackageMappingsState(JSON.parse(savedMappings));

          const savedOrders = localStorage.getItem('gamepay_orders');
          if (savedOrders) setOrdersState(JSON.parse(savedOrders));

          setFinancialArchivesState(getStoredFinancialArchives());
        } catch (e) {}
      }, 0);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('gamepay_settings_updated', handleSync);
    window.addEventListener('gamepay_suppliers_updated', handleSync);
    window.addEventListener('gamepay_financial_updated', handleSync);
    window.addEventListener('orders_updated', handleSync);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('gamepay_settings_updated', handleSync);
      window.removeEventListener('gamepay_suppliers_updated', handleSync);
      window.removeEventListener('gamepay_financial_updated', handleSync);
      window.removeEventListener('orders_updated', handleSync);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        exchangeRatePerUSD,
        formatIQD,
        suppliers,
        updateSupplier,
        addSupplier,
        deleteSupplier,
        safety,
        updateSafety,
        services,
        updateServices,
        packageMappings,
        updatePackageMappings,
        importSupplierPackageToCatalog,
        orders,
        dispatchNewOrder,
        financialArchives,
        refreshFinancials,
        wipeAllFinancialAndLogData,
        apiLogs,
        addApiLog,
        toasts,
        addToast,
        removeToast,
        clearToasts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
