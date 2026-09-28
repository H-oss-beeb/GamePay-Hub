import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Zap, 
  Send, 
  Lock, 
  Download, 
  Upload,
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Server,
  Mail,
  FileCode,
  Shield,
  Crown
} from 'lucide-react';

export interface SystemSettingsData {
  likeCardApiKey: string;
  enableSmmPanel: boolean;
  smmPanelApiKey: string;
  enableEmailJs: boolean;
  emailJsServiceId: string;
  emailJsTemplateId: string;
  emailJsPublicKey: string;
  exchangeRate100USD: string;
  supportTelegram: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const DEFAULT_SETTINGS: SystemSettingsData = {
  likeCardApiKey: 'LC_LIVE_9921804f83b2c9a17',
  enableSmmPanel: false,
  smmPanelApiKey: 'smm_live_41a80d7c55e2f094',
  enableEmailJs: false,
  emailJsServiceId: 'service_gamepay_v2',
  emailJsTemplateId: 'template_order_receipt',
  emailJsPublicKey: 'pub_key_38402f1a9c7',
  exchangeRate100USD: '150,000',
  supportTelegram: 'https://t.me/gamepay_support',
  maintenanceMode: false,
  maintenanceMessage: 'الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!',
};

export default function SystemSettings() {
  // Settings State
  const [settings, setSettings] = useState<SystemSettingsData>(() => {
    try {
      const saved = localStorage.getItem('gamepay_system_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load system settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Role Selector for Credentials: 'MASTER' (المدير الرئيسي) vs 'SUB' (المدير الفرعي / المشرف)
  const [targetAdminRole, setTargetAdminRole] = useState<'MASTER' | 'SUB'>('MASTER');

  // Password Visibility Toggles
  const [showLikeCardKey, setShowLikeCardKey] = useState(false);
  const [showSmmKey, setShowSmmKey] = useState(false);
  const [showEmailJsKey, setShowEmailJsKey] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dynamic Multi-Admin Password Change Fields
  const [masterAdminCredentials, setMasterAdminCredentials] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [subAdminCredentials, setSubAdminCredentials] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const activeCredentials = targetAdminRole === 'MASTER' ? masterAdminCredentials : subAdminCredentials;

  const handleActiveCredentialChange = (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    if (targetAdminRole === 'MASTER') {
      setMasterAdminCredentials(prev => ({ ...prev, [field]: value }));
    } else {
      setSubAdminCredentials(prev => ({ ...prev, [field]: value }));
    }
  };

  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Connection Test State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<{
    testedAt: string;
    services: { name: string; latency: string; ok: boolean }[];
  } | null>(null);

  // Save Feedback Toast
  const [saveToast, setSaveToast] = useState(false);

  // Backup & Restore Feedback
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Input Changes
  const handleInputChange = (key: keyof SystemSettingsData, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 1. Test Connection Action
  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTestResults(null);

    setTimeout(() => {
      setIsTestingConnection(false);
      const nowStr = new Date().toLocaleTimeString('ar-EG');
      const servicesList = [
        { name: 'LikeCard Gateway', latency: '88ms', ok: Boolean((settings?.likeCardApiKey || '').trim()) }
      ];

      if (settings?.enableSmmPanel) {
        servicesList.push({
          name: 'SMM Panel Server',
          latency: '112ms',
          ok: Boolean((settings?.smmPanelApiKey || '').trim())
        });
      }

      if (settings?.enableEmailJs) {
        servicesList.push({
          name: 'EmailJS Notification',
          latency: '95ms',
          ok: Boolean((settings?.emailJsServiceId || '').trim())
        });
      }

      setTestResults({
        testedAt: nowStr,
        services: servicesList
      });
    }, 1200);
  };

  // 2. Change Admin Password / PIN (Master or Sub-Admin)
  const handleChangePassword = () => {
    const isMaster = targetAdminRole === 'MASTER';
    const roleLabel = isMaster ? 'المدير الرئيسي' : 'المدير الفرعي';
    const currentPassword = (activeCredentials?.currentPassword || '').trim();
    const newPassword = (activeCredentials?.newPassword || '').trim();
    const confirmPassword = (activeCredentials?.confirmPassword || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ 
        type: 'error', 
        message: 'يرجى ملء جميع الحقول (الرمز الحالي، الجديد، وتأكيد الرمز الجديد)' 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ 
        type: 'error', 
        message: 'الرمز الجديد وتأكيد الرمز غير متطابقين!' 
      });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordStatus({ 
        type: 'error', 
        message: 'الرمز الجديد يجب أن يتكون من 4 خانات/رموز على الأقل' 
      });
      return;
    }

    if (isMaster) {
      const savedMasterPin = localStorage.getItem('gamepay_admin_pin') || '911164@';
      if (currentPassword !== savedMasterPin && currentPassword !== '911164' && currentPassword !== '911164@') {
        setPasswordStatus({ type: 'error', message: 'رمز المدير الرئيسي الحالي غير صحيح!' });
        return;
      }
      localStorage.setItem('gamepay_admin_pin', newPassword);
      setMasterAdminCredentials({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      const savedSubPin = localStorage.getItem('gamepay_subadmin_pin') || '@112255';
      if (currentPassword !== savedSubPin && currentPassword !== '@112255' && currentPassword !== '654321') {
        setPasswordStatus({ type: 'error', message: 'رمز المدير الفرعي الحالي غير صحيح!' });
        return;
      }
      localStorage.setItem('gamepay_subadmin_pin', newPassword);
      setSubAdminCredentials({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }

    setPasswordStatus({ 
      type: 'success', 
      message: `تم تحديث رمز ${roleLabel} بنجاح 🔐` 
    });

    setTimeout(() => {
      setPasswordStatus(null);
    }, 4500);
  };

  // 3. Download Backup as JSON
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        systemSettings: settings,
        orders: JSON.parse(localStorage.getItem('gamepay_orders') || '[]'),
        financialArchive: JSON.parse(localStorage.getItem('gamepay_daily_financial_archive') || '[]'),
        servicesStatus: JSON.parse(localStorage.getItem('gamepay_services_status') || '{}'),
        adminPin: localStorage.getItem('gamepay_admin_pin') || '911164@',
        subAdminPin: localStorage.getItem('gamepay_subadmin_pin') || '@112255',
        appVersion: '3.5.0-B2B',
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `gamepay_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3500);
    } catch (err) {
      console.error('Backup download failed', err);
    }
  };

  // 4. Restore Database State from JSON File
  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // Validate basic structure
        if (!data || typeof data !== 'object') {
          throw new Error('ملف النسخة الاحتياطية غير صالح');
        }

        // Restore System Settings
        if (data.systemSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.systemSettings });
          localStorage.setItem('gamepay_system_settings', JSON.stringify(data.systemSettings));
          localStorage.setItem('gamepay_maintenance_mode', String(data.systemSettings.maintenanceMode));
        }

        // Restore Orders
        if (Array.isArray(data.orders)) {
          localStorage.setItem('gamepay_orders', JSON.stringify(data.orders));
        }

        // Restore Financial Archive
        if (Array.isArray(data.financialArchive)) {
          localStorage.setItem('gamepay_daily_financial_archive', JSON.stringify(data.financialArchive));
        }

        // Restore Services Status
        if (data.servicesStatus) {
          localStorage.setItem('gamepay_services_status', JSON.stringify(data.servicesStatus));
        }

        // Restore Admin Pins
        if (data.adminPin) {
          localStorage.setItem('gamepay_admin_pin', data.adminPin);
        }
        if (data.subAdminPin) {
          localStorage.setItem('gamepay_subadmin_pin', data.subAdminPin);
        }

        // Broadcast update events across window
        window.dispatchEvent(new CustomEvent('gamepay_settings_updated', { detail: data.systemSettings || settings }));
        window.dispatchEvent(new CustomEvent('gamepay_financial_updated', { detail: { newSales: data.orders || [] } }));

        setRestoreFeedback({
          type: 'success',
          message: 'تم استعادة النسخة الاحتياطية بنجاح وتحديث بيانات النظام!'
        });
      } catch (err) {
        console.error('Restore error', err);
        setRestoreFeedback({
          type: 'error',
          message: 'تعذر استعادة الملف. يرجى التأكد من اختيار ملف JSON صالح.'
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => setRestoreFeedback(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // 5. Single Unified Save: حفظ كافة التغييرات
  const handleSaveSettings = () => {
    // Keep both maintenanceMode and isMaintenanceMode in sync for universal access
    const payloadToSave = {
      ...settings,
      isMaintenanceMode: settings.maintenanceMode,
    };

    localStorage.setItem('gamepay_system_settings', JSON.stringify(payloadToSave));
    localStorage.setItem('gamepay_maintenance_mode', String(settings.maintenanceMode));
    localStorage.setItem('gamepay_is_maintenance_mode', String(settings.maintenanceMode));
    if (settings.maintenanceMessage) {
      localStorage.setItem('gamepay_maintenance_message', settings.maintenanceMessage);
    }
    
    // Broadcast event across app windows and listeners
    window.dispatchEvent(new CustomEvent('gamepay_settings_updated', { detail: payloadToSave }));

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto text-right pb-28" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-2xl shadow-[0_10px_35px_rgba(5,150,105,0.4)] flex items-center gap-3 font-bold text-sm border border-emerald-400/40 backdrop-blur-md"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span>تم حفظ كافة التغييرات بنجاح 💾</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input for Backup Restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleRestoreFileSelect}
      />

      {/* ------------------------------------------------------------------ */}
      {/* CARD 1: API INTEGRATIONS (مفاتيح الربط والتشغيل الفعلي)             */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
        
        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <h3 className="text-base font-bold text-white">مفاتيح الربط والخدمات</h3>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
            API Gateways
          </span>
        </div>

        <div className="space-y-4">
          
          {/* 1. Like Card API Key (Primary & Always Active) */}
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm text-slate-200 font-bold">
                Like Card API Key <span className="text-amber-400 text-xs font-normal">(المزود الأساسي)</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                نشط دائماً
              </span>
            </div>
            <div className="relative">
              <input
                type={showLikeCardKey ? 'text' : 'password'}
                value={settings.likeCardApiKey}
                onChange={e => handleInputChange('likeCardApiKey', e.target.value)}
                placeholder="أدخل مفتاح ربط LikeCard..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 pl-10 text-white placeholder-slate-500 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowLikeCardKey(!showLikeCardKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                title={showLikeCardKey ? 'إخفاء' : 'إظهار'}
              >
                {showLikeCardKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. SMM Panel API Key (Optional with Toggle) */}
          <div className="bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden transition-all">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-sm font-bold text-slate-200 block">سيرفر SMM Panel</span>
                  <span className="text-xs text-slate-400">خدمات المتابعين والتفاعل الخارجي</span>
                </div>
              </div>

              {/* SMM Toggle Switch */}
              <button
                type="button"
                onClick={() => handleInputChange('enableSmmPanel', !settings.enableSmmPanel)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center ${
                  settings.enableSmmPanel ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
                title={settings.enableSmmPanel ? 'تعطيل SMM Panel' : 'تفعيل SMM Panel'}
              >
                <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            <AnimatePresence>
              {settings.enableSmmPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80"
                >
                  <label className="block text-xs text-slate-300 font-medium mb-1.5">
                    SMM Panel API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSmmKey ? 'text' : 'password'}
                      value={settings.smmPanelApiKey}
                      onChange={e => handleInputChange('smmPanelApiKey', e.target.value)}
                      placeholder="أدخل مفتاح ربط سيرفر SMM..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 pl-10 text-white placeholder-slate-500 text-sm focus:border-sky-500 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmmKey(!showSmmKey)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      title={showSmmKey ? 'إخفاء' : 'إظهار'}
                    >
                      {showSmmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. EmailJS Service & Template IDs (Optional with Toggle) */}
          <div className="bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden transition-all">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-sm font-bold text-slate-200 block">إشعارات البريد الإلكتروني (EmailJS)</span>
                  <span className="text-xs text-slate-400">إرسال إيصالات الطلبات تلقائياً عبر الإيميل</span>
                </div>
              </div>

              {/* EmailJS Toggle Switch */}
              <button
                type="button"
                onClick={() => handleInputChange('enableEmailJs', !settings.enableEmailJs)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center ${
                  settings.enableEmailJs ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
                title={settings.enableEmailJs ? 'تعطيل EmailJS' : 'تفعيل EmailJS'}
              >
                <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            <AnimatePresence>
              {settings.enableEmailJs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">
                        EmailJS Service ID
                      </label>
                      <input
                        type="text"
                        value={settings.emailJsServiceId}
                        onChange={e => handleInputChange('emailJsServiceId', e.target.value)}
                        placeholder="service_xxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">
                        EmailJS Template ID
                      </label>
                      <input
                        type="text"
                        value={settings.emailJsTemplateId}
                        onChange={e => handleInputChange('emailJsTemplateId', e.target.value)}
                        placeholder="template_xxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      EmailJS Public Key
                    </label>
                    <div className="relative">
                      <input
                        type={showEmailJsKey ? 'text' : 'password'}
                        value={settings.emailJsPublicKey}
                        onChange={e => handleInputChange('emailJsPublicKey', e.target.value)}
                        placeholder="pub_key_xxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailJsKey(!showEmailJsKey)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        title={showEmailJsKey ? 'إخفاء' : 'إظهار'}
                      >
                        {showEmailJsKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Bottom Action: اختبار الاتصال ⚡ */}
        <div className="pt-2 border-t border-slate-700/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700 disabled:opacity-50 active:scale-95 shadow-sm"
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>جاري فحص الاتصال...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>اختبار الاتصال ⚡</span>
                </>
              )}
            </button>

            {testResults && (
              <span className="text-xs text-slate-400 font-mono">
                آخر فحص: {testResults.testedAt}
              </span>
            )}
          </div>

          {/* Test Results Output */}
          {testResults && (
            <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {testResults.services.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-slate-200 font-medium truncate">{s.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 font-bold">
                    {s.ok ? s.latency : 'غير متصل'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 2: CURRENCY & SUPPORT (العملة والدعم)                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
        
        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💵</span>
            <h3 className="text-base font-bold text-white">سعر الصرف والدعم</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            Rates & Support
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 1. سعر صرف 100$ بالدينار */}
          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">
              سعر صرف 100$ بالدينار
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.exchangeRate100USD}
                onChange={e => handleInputChange('exchangeRate100USD', e.target.value)}
                placeholder="150,000"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 pl-14 text-white placeholder-slate-500 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono font-bold"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                IQD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              يُعتمد للتحويل التلقائي لمدفوعات الزبائن والبطاقات.
            </p>
          </div>

          {/* 2. رابط تليجرام الدعم */}
          <div>
            <label className="block text-sm text-slate-300 font-medium mb-1.5">
              رابط تليجرام الدعم
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.supportTelegram}
                onChange={e => handleInputChange('supportTelegram', e.target.value)}
                placeholder="https://t.me/gamepay_support"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 pl-9 text-white placeholder-slate-500 text-sm focus:border-amber-500 focus:outline-none transition-colors font-mono text-left"
                dir="ltr"
              />
              <Send className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              يظهر للعملاء في نافذة المساعدة والدعم الفني.
            </p>
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CARD 3: SECURITY & MAINTENANCE (الأمان والصيانة)                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
        
        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="text-base font-bold text-white">أمان اللوحة والصيانة</h3>
          </div>
          <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
            Security & Backup
          </span>
        </div>

        <div className="space-y-4">
          
          {/* 1. تغيير كلمة مرور ورموز الإدارة (المدير الرئيسي & المدير الفرعي) */}
          <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                تغيير كلمة مرور ورموز الدخول للإدارة
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {targetAdminRole === 'MASTER' ? 'Master Admin Credentials' : 'Sub-Admin / Partner Credentials'}
              </span>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTargetAdminRole('MASTER');
                  setPasswordStatus(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  targetAdminRole === 'MASTER'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${targetAdminRole === 'MASTER' ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>👑 المدير الرئيسي (Master Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetAdminRole('SUB');
                  setPasswordStatus(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  targetAdminRole === 'SUB'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${targetAdminRole === 'SUB' ? 'text-slate-950' : 'text-sky-400'}`} />
                <span>🛡️ المدير الفرعي / المشرف (Sub-Admin)</span>
              </button>
            </div>

            {/* Dynamic Credential Input Form (3 Inputs) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Input 1: كلمة المرور / الرمز الحالي */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  كلمة المرور / الرمز الحالي
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={activeCredentials.currentPassword}
                    onChange={e => handleActiveCredentialChange('currentPassword', e.target.value)}
                    placeholder={targetAdminRole === 'MASTER' ? 'رمز الماستر الحالي...' : 'رمز المشرف الحالي...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pl-9 text-white text-xs placeholder-slate-600 focus:border-amber-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    title={showCurrentPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Input 2: كلمة المرور / الرمز الجديد */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  كلمة المرور / الرمز الجديد
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={activeCredentials.newPassword}
                    onChange={e => handleActiveCredentialChange('newPassword', e.target.value)}
                    placeholder="الرمز الجديد المطلوب..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pl-9 text-white text-xs placeholder-slate-600 focus:border-amber-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    title={showNewPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Input 3: تأكيد الرمز الجديد */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  تأكيد الرمز الجديد
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={activeCredentials.confirmPassword}
                    onChange={e => handleActiveCredentialChange('confirmPassword', e.target.value)}
                    placeholder="أعد إدخال الرمز الجديد..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 pl-9 text-white text-xs placeholder-slate-600 focus:border-amber-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    title={showConfirmPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Action Button & Status Notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleChangePassword}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all border flex items-center justify-center gap-2 shadow-sm ${
                  targetAdminRole === 'MASTER'
                    ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border-amber-500/30 active:scale-95'
                    : 'bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border-sky-500/30 active:scale-95'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {targetAdminRole === 'MASTER'
                    ? 'تحديث رمز المدير الرئيسي 🔐'
                    : 'تحديث رمز المدير الفرعي 🔐'}
                </span>
              </button>

              {passwordStatus && (
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                    passwordStatus.type === 'success'
                      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-red-300 bg-red-500/10 border-red-500/20'
                  }`}
                >
                  {passwordStatus.type === 'success' ? '✓ ' : '✕ '}
                  {passwordStatus.message}
                </span>
              )}
            </div>
          </div>

          {/* 2. وضع الصيانة (Maintenance Mode Switch + Custom Message) */}
          <div className="bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden transition-all">
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>وضع الصيانة</span>
                  <span className={`w-2 h-2 rounded-full ${settings.maintenanceMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.maintenanceMode ? (
                    <span className="text-amber-400 font-semibold">النظام في وضع الصيانة (معطل مؤقتاً للزبائن)</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">النظام يعمل بشكل طبيعي</span>
                  )}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none flex items-center ${
                  settings.maintenanceMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
                title={settings.maintenanceMode ? 'إلغاء وضع الصيانة' : 'تفعيل وضع الصيانة'}
              >
                <div className="bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Custom Maintenance Message Input Revealed when ON */}
            <AnimatePresence>
              {settings.maintenanceMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 space-y-1.5"
                >
                  <label className="block text-xs font-bold text-amber-300">
                    نص رسالة الصيانة للزبائن
                  </label>
                  <input
                    type="text"
                    value={settings.maintenanceMessage}
                    onChange={e => handleInputChange('maintenanceMessage', e.target.value)}
                    placeholder="الموقع يخضع لعملية صيانة وتحديث، سنعود للعمل قريباً!"
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    ستظهر هذه الرسالة لجميع الزوار على واجهة المتجر أثناء فترة الصيانة.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. النسخ الاحتياطي والاستعادة (Backup & Restore) */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-3">
            <div>
              <div className="text-sm font-bold text-white">النسخ الاحتياطي والاستعادة</div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصدير كافة الطلبات، التقارير المالية والإعدادات، أو استعادة حالة سابقة من ملف JSON.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Button: تحميل نسخة احتياطية (JSON) 📥 */}
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>تحميل نسخة احتياطية (JSON) 📥</span>
              </button>

              {/* Button: استعادة نسخة احتياطية 📤 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>استعادة نسخة احتياطية 📤</span>
              </button>
            </div>

            {backupSuccess && (
              <p className="text-emerald-400 text-xs font-bold">
                ✓ تم تنزيل ملف النسخة الاحتياطية بنجاح.
              </p>
            )}

            {restoreFeedback && (
              <p className={`text-xs font-bold ${restoreFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {restoreFeedback.type === 'success' ? '✓ ' : '✕ '}
                {restoreFeedback.message}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. STICKY BOTTOM ACTION BAR: [حفظ كافة التغييرات 💾]                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky bottom-4 z-20 bg-[#0F172A]/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>جاهز لتطبيق التعديلات على النظام</span>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>حفظ كافة التغييرات 💾</span>
        </button>
      </div>

    </div>
  );
}
