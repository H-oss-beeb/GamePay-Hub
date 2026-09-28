import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Coins, 
  Archive, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Eye, 
  Download, 
  Search, 
  X, 
  ChevronRight, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Filter,
  Gamepad2,
  PackageX,
  Inbox,
  CalendarDays,
  PlusCircle,
  RotateCcw,
  AlertTriangle,
  Trash2,
  EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { INITIAL_SERVICES_DATA } from './ProductsManager';
import { 
  ItemizedSale, 
  DailyArchiveRecord, 
  getArabicDayName, 
  getTodayDateString, 
  generateZeroed30DaysArchive, 
  getStoredFinancialArchives, 
  recordOrderToDailyFinancialArchive 
} from '../utils/financialArchiveSync';
import { 
  exportArchiveSummaryToExcel, 
  exportDaySalesToExcel 
} from '../utils/excelReportGenerator';

export default function ReportsArchiving() {
  const { financialArchives: globalArchives, formatIQD, wipeAllFinancialAndLogData, addToast } = useApp();
  const initialTodayStr = getTodayDateString();

  // 1. Archives State - ZERO INITIAL METRICS / STORED
  const [archives, setArchives] = useState<DailyArchiveRecord[]>(() => {
    if (globalArchives && globalArchives.length > 0) {
      return globalArchives;
    }
    return getStoredFinancialArchives();
  });

  useEffect(() => {
    if (globalArchives && globalArchives.length > 0) {
      setArchives(globalArchives);
    }
  }, [globalArchives]);


  // Real-time synchronization with global Order Context / Database / LocalStorage
  useEffect(() => {
    const handleSync = () => {
      const freshArchives = getStoredFinancialArchives();
      setArchives(freshArchives);

      // Dynamically update modal if currently opened
      setSelectedDayArchive(prev => {
        if (!prev) return null;
        const matchingDay = freshArchives.find(r => r.date === prev.date);
        return matchingDay || prev;
      });
    };

    window.addEventListener('gamepay_financial_updated', handleSync);
    window.addEventListener('orders_updated', handleSync);
    window.addEventListener('gamepay_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('gamepay_financial_updated', handleSync);
      window.removeEventListener('orders_updated', handleSync);
      window.removeEventListener('gamepay_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter Switcher: [ اليوم 📅 | هذا الأسبوع 📆 | هذا الشهر 🗓️ | اختيار يوم محدد 📆 ]
  const [activeFilter, setActiveFilter] = useState<'today' | 'this_week' | 'this_month' | 'custom_day'>('this_month');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(initialTodayStr);

  // Slide-over modal state for specific day details
  const [selectedDayArchive, setSelectedDayArchive] = useState<DailyArchiveRecord | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Safe Data Reset Confirmation Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSecurityCode, setResetSecurityCode] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const REQUIRED_RESET_CODE = 'h91164';

  const handleOpenResetModal = () => {
    setResetSecurityCode('');
    setShowResetCode(false);
    setResetError(false);
    setIsInputShaking(false);
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetSecurityCode('');
    setShowResetCode(false);
    setResetError(false);
    setIsInputShaking(false);
  };

  const handleConfirmReset = () => {
    const enteredCode = (resetSecurityCode || '').trim();
    const masterAdminPin = (localStorage.getItem('gamepay_admin_pin') || '911164@').trim();

    // Validate in background against hidden secret key h91164 (or Master Admin PIN)
    const isCodeValid = enteredCode === REQUIRED_RESET_CODE || 
                        enteredCode === masterAdminPin || 
                        enteredCode === '911164';

    if (!isCodeValid) {
      setResetError(true);
      setIsInputShaking(true);
      setTimeout(() => setIsInputShaking(false), 600);
      addToast({
        title: 'خطأ في التحقق',
        message: 'رمز الأمان السري غير صحيح!',
        type: 'error'
      });
      return;
    }

    // 1. Wipe all local logs, daily revenue totals, and archived reports state
    wipeAllFinancialAndLogData();
    const zeroed = generateZeroed30DaysArchive();
    setArchives(zeroed);
    if (selectedDayArchive) {
      setSelectedDayArchive(null);
    }

    // 2. Close modal
    setIsResetModalOpen(false);
    setResetSecurityCode('');
    setShowResetCode(false);
    setResetError(false);

    // 3. Show floating toast notification
    addToast({
      title: 'تم تصفير البيانات بنجاح',
      message: 'تم تصفير كافة البيانات والسجلات الماليّة بنجاح 🧹',
      type: 'success'
    });
  };


  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state to localStorage
  const updateArchivesState = (newArchives: DailyArchiveRecord[]) => {
    setArchives(newArchives);
    localStorage.setItem('gamepay_financial_archives_v2', JSON.stringify(newArchives));
    window.dispatchEvent(new Event('gamepay_financial_updated'));
  };

  // Optional tool: Add a quick sample order to test the system live
  const handleAddSampleOrder = () => {
    const targetDate = activeFilter === 'custom_day' ? selectedCustomDate : initialTodayStr;
    const services = INITIAL_SERVICES_DATA;
    const randomService = services[Math.floor(Math.random() * services.length)];
    const randomPkg = randomService.packages[Math.floor(Math.random() * randomService.packages.length)];

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const orderNum = `GP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newItem: ItemizedSale = {
      id: `sale_${Date.now()}_${Math.random()}`,
      orderNumber: orderNum,
      time: timeStr,
      serviceName: randomService.name,
      packageTitle: randomPkg.title,
      serviceImage: randomService.image,
      recipientId: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      wholesaleCost: randomPkg.wholesaleCost,
      retailPrice: randomPkg.retailPrice,
      netProfit: Number((randomPkg.retailPrice - randomPkg.wholesaleCost).toFixed(2)),
      supplier: 'LikeCard B2B API',
      status: 'completed'
    };

    const nextArchives = [...archives];
    let dayIndex = nextArchives.findIndex(r => r.date === targetDate);

    if (dayIndex === -1) {
      nextArchives.unshift({
        date: targetDate,
        dayName: getArabicDayName(targetDate),
        transactionCount: 1,
        grossRevenue: newItem.retailPrice,
        wholesaleCost: newItem.wholesaleCost,
        netProfit: newItem.netProfit,
        profitMargin: Number(((newItem.netProfit / newItem.retailPrice) * 100).toFixed(1)),
        items: [newItem]
      });
    } else {
      const cur = nextArchives[dayIndex];
      const updatedItems = [newItem, ...cur.items];
      const updatedRevenue = Number((cur.grossRevenue + newItem.retailPrice).toFixed(2));
      const updatedWholesale = Number((cur.wholesaleCost + newItem.wholesaleCost).toFixed(2));
      const updatedProfit = Number((updatedRevenue - updatedWholesale).toFixed(2));
      const margin = updatedRevenue > 0 ? Number(((updatedProfit / updatedRevenue) * 100).toFixed(1)) : 0;

      nextArchives[dayIndex] = {
        ...cur,
        transactionCount: cur.transactionCount + 1,
        grossRevenue: updatedRevenue,
        wholesaleCost: updatedWholesale,
        netProfit: updatedProfit,
        profitMargin: margin,
        items: updatedItems
      };
    }

    updateArchivesState(nextArchives);
    if (selectedDayArchive && selectedDayArchive.date === targetDate) {
      const updated = nextArchives.find(r => r.date === targetDate);
      if (updated) setSelectedDayArchive(updated);
    }
    showToast(`✅ تم تسجيل عملية شحن تجريبية (${randomService.name}) بنجاح`);
  };

  // Filtered Archive Records based on active switcher
  const filteredRecords = useMemo(() => {
    if (activeFilter === 'today') {
      const todayRec = archives.find(r => r.date === initialTodayStr);
      return todayRec ? [todayRec] : (archives.length > 0 ? [archives[0]] : []);
    }
    if (activeFilter === 'this_week') {
      return archives.slice(0, 7);
    }
    if (activeFilter === 'this_month') {
      return archives.slice(0, 30);
    }
    if (activeFilter === 'custom_day') {
      const found = archives.find(r => r.date === selectedCustomDate);
      if (found) return [found];
      // If date is outside existing archives, return an on-the-fly zero record
      return [{
        date: selectedCustomDate,
        dayName: getArabicDayName(selectedCustomDate) || 'محدد',
        transactionCount: 0,
        grossRevenue: 0,
        wholesaleCost: 0,
        netProfit: 0,
        profitMargin: 0,
        items: []
      }];
    }
    return archives;
  }, [archives, activeFilter, selectedCustomDate, initialTodayStr]);

  // Calculations for Top 4 KPI Cards
  const kpiMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalWholesale = 0;
    let totalTransactions = 0;

    filteredRecords.forEach(rec => {
      totalRevenue += rec.grossRevenue;
      totalWholesale += rec.wholesaleCost;
      totalTransactions += rec.transactionCount;
    });

    const netProfit = Number((totalRevenue - totalWholesale).toFixed(2));
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalWholesale: Number(totalWholesale.toFixed(2)),
      netProfit,
      profitMargin,
      totalTransactions
    };
  }, [filteredRecords]);

  // Calculations for Top Selling Services (Box A) & Top Packages (Box B)
  const { topServices, topPackages } = useMemo(() => {
    const serviceMap = new Map<string, { name: string; image?: string; count: number; netProfit: number }>();
    const packageMap = new Map<string, { serviceName: string; packageTitle: string; count: number; netProfit: number; unitProfit: number }>();

    filteredRecords.forEach(rec => {
      rec.items.forEach(item => {
        // Services aggregation
        const sKey = item.serviceName;
        const sExisting = serviceMap.get(sKey) || { name: sKey, image: item.serviceImage, count: 0, netProfit: 0 };
        sExisting.count += 1;
        sExisting.netProfit += item.netProfit;
        serviceMap.set(sKey, sExisting);

        // Packages aggregation
        const pKey = `${item.serviceName} - ${item.packageTitle}`;
        const pExisting = packageMap.get(pKey) || {
          serviceName: item.serviceName,
          packageTitle: item.packageTitle,
          count: 0,
          netProfit: 0,
          unitProfit: item.netProfit
        };
        pExisting.count += 1;
        pExisting.netProfit += item.netProfit;
        packageMap.set(pKey, pExisting);
      });
    });

    const sortedServices = Array.from(serviceMap.values())
      .map(s => ({ ...s, netProfit: Number(s.netProfit.toFixed(2)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sortedPackages = Array.from(packageMap.values())
      .map(p => ({ ...p, netProfit: Number(p.netProfit.toFixed(2)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { topServices: sortedServices, topPackages: sortedPackages };
  }, [filteredRecords]);

  // Export to Excel using xlsx-js-style with RTL, auto-widths, navy header, and summary row
  const handleExportExcel = () => {
    try {
      const filterNames: Record<string, string> = {
        today: 'اليوم',
        this_week: 'هذا الأسبوع',
        this_month: 'هذا الشهر',
        custom_day: `يوم ${selectedCustomDate}`
      };
      exportArchiveSummaryToExcel(filteredRecords, filterNames[activeFilter] || activeFilter);
      showToast('📊 تم تصدير تقرير Excel الاحترافي المنسق بنجاح');
    } catch (err) {
      console.error('Export error:', err);
      showToast('❌ حدث خطأ أثناء تصدير ملف Excel');
    }
  };

  // Export to PDF / Printable Report
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('⚠️ يرجى السماح بالنوافذ المنبثقة لتوليد ملف PDF');
      return;
    }

    const rowsHtml = filteredRecords.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0; text-align: right;">
        <td style="padding: 10px 14px; font-weight: bold;">${r.date} (${r.dayName})</td>
        <td style="padding: 10px 14px;">${r.transactionCount} عملية</td>
        <td style="padding: 10px 14px; font-family: monospace;">$${r.grossRevenue.toFixed(2)}</td>
        <td style="padding: 10px 14px; font-family: monospace; color: #64748b;">$${r.wholesaleCost.toFixed(2)}</td>
        <td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #059669;">+$${r.netProfit.toFixed(2)}</td>
        <td style="padding: 10px 14px; font-weight: bold;">${r.profitMargin}%</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير مالي رسمي - GamePay B2B</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
          .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 20px; min-width: 140px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background: #0f172a; color: white; padding: 12px 14px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 24px;">منصة GamePay B2B - التقرير المالي والأرشيف</h1>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-IQ')} • النطاق: ${activeFilter}</p>
          </div>
          <div style="font-size: 20px; font-weight: 900; background: #f59e0b; color: #0f172a; padding: 8px 16px; border-radius: 8px;">
            GamePay Engine
          </div>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
          <div class="kpi-box">
            <div style="font-size: 12px; color: #64748b;">إجمالي المبيعات</div>
            <div style="font-size: 20px; font-weight: 900;">$${kpiMetrics.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="kpi-box">
            <div style="font-size: 12px; color: #64748b;">تكلفة الجملة</div>
            <div style="font-size: 20px; font-weight: 900;">$${kpiMetrics.totalWholesale.toFixed(2)}</div>
          </div>
          <div class="kpi-box" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div style="font-size: 12px; color: #059669; font-weight: bold;">الربح الصافي</div>
            <div style="font-size: 20px; font-weight: 900; color: #059669;">+$${kpiMetrics.netProfit.toFixed(2)}</div>
          </div>
          <div class="kpi-box">
            <div style="font-size: 12px; color: #64748b;">إجمالي العمليات</div>
            <div style="font-size: 20px; font-weight: 900;">${kpiMetrics.totalTransactions} عمليات</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>عدد العمليات اليومية</th>
              <th>إجمالي المبيعات ($)</th>
              <th>تكلفة الجملة ($)</th>
              <th>الربح الصافي ($)</th>
              <th>الهامش</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    showToast('📄 جاري فتح نافذة طباعة التقرير كـ PDF');
  };

  // Download Day's Specific Report as professional styled Excel
  const handleDownloadDayReport = (day: DailyArchiveRecord) => {
    try {
      exportDaySalesToExcel(day);
      showToast(`📊 تم تصدير تقرير مبيعات يوم (${day.date}) بصيغة Excel الاحترافية بنجاح`);
    } catch (err) {
      console.error('Export error:', err);
      showToast('❌ حدث خطأ أثناء تصدير ملف Excel');
    }
  };

  // Filtered items inside Slide-over Modal
  const modalFilteredItems = useMemo(() => {
    if (!selectedDayArchive) return [];
    const rawQuery = (modalSearchQuery || '').trim();
    if (!rawQuery) return selectedDayArchive.items;
    const q = rawQuery.toLowerCase();
    return selectedDayArchive.items.filter(it => 
      it.orderNumber.toLowerCase().includes(q) ||
      it.serviceName.toLowerCase().includes(q) ||
      it.packageTitle.toLowerCase().includes(q) ||
      it.recipientId.includes(q)
    );
  }, [selectedDayArchive, modalSearchQuery]);

  return (
    <div className="space-y-8 pb-24 text-slate-100 font-sans" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border backdrop-blur-xl bg-slate-900/95 text-amber-400 border-amber-500/50 shadow-amber-500/20"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* HEADER CONTROLS & REFACTORED FILTER BAR                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-6 bg-slate-900/90 border border-slate-800/80 p-5 sm:p-6 rounded-2xl shadow-xl backdrop-blur-xl">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>التقارير المالية والأرشفة السحابية 📈</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                تحليل الإيرادات، حساب الأرباح الصافية اللحظية، وسجل الأرشيف لآخر 30 يوماً
              </p>
            </div>
          </div>

          {/* Quick simulation controls */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleAddSampleOrder}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
              title="تسجيل عملية تجريبية لاختبار المنظومة المالية"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>تسجيل عملية تجريبية</span>
            </button>

            <button
              type="button"
              onClick={handleOpenResetModal}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
              title="تصفير كافة الإحصائيات والأرقام بعد التأكيد الأمني (h91164)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير البيانات</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Export Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          
          {/* Filter Options: [ اليوم 📅 | هذا الأسبوع 📆 | هذا الشهر 🗓️ | اختيار يوم محدد 📆 ] */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setActiveFilter('today')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeFilter === 'today'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>اليوم 📅</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('this_week')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeFilter === 'this_week'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>هذا الأسبوع 📆</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('this_month')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeFilter === 'this_month'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>هذا الشهر 🗓️</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('custom_day')}
                className={`px-3 sm:px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeFilter === 'custom_day'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>اختيار يوم محدد 📆</span>
              </button>
            </div>

            {/* Inline Native Date Picker when 'اختيار يوم محدد' is active */}
            {activeFilter === 'custom_day' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-amber-500/40 shadow-inner"
              >
                <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" />
                <label className="text-[11px] text-slate-400 font-bold hidden sm:inline">التاريخ:</label>
                <input
                  type="date"
                  value={selectedCustomDate}
                  onChange={(e) => setSelectedCustomDate(e.target.value)}
                  className="bg-slate-900 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none transition-colors"
                />
                <span className="text-amber-400 font-bold text-xs">
                  {getArabicDayName(selectedCustomDate)}
                </span>
              </motion.div>
            )}
          </div>

          {/* Export Actions: [ تصدير Excel 📊 | تنزيل PDF 📄 ] */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel 📊</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-rose-400 border border-rose-500/30 hover:border-rose-500/60 text-xs font-black flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>تنزيل PDF 📄</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP KPI METRICS CARDS (كروت المؤشرات المالية الرئيسية)          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: إجمالي المبيعات (Revenue) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المبيعات (Revenue)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              ${kpiMetrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${kpiMetrics.totalTransactions > 0 ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span>{kpiMetrics.totalTransactions} عمليات مسجلة</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: تكلفة الشراء (Wholesale Cost) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">تكلفة الشراء (Wholesale Cost)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-200 font-mono tracking-tight">
              ${kpiMetrics.totalWholesale.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-400">
              <span>مدفوعة لبوابات الـ API (لايك كارد)</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: الربح الصافي (Net Profit) - Highlighted Green Box */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden ring-1 ring-emerald-500/20"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-400">الربح الصافي (Net Profit)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                صافي الفائدة
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight flex items-center gap-1">
              <span>+${kpiMetrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-300/90">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>{kpiMetrics.profitMargin}% هامش ربح صافي</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: إجمالي العمليات والأرشيف النشط */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي العمليات (Total Operations)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Archive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              {kpiMetrics.totalTransactions} <span className="text-sm font-sans font-normal text-slate-400">عمليات</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>أرشيف 30 يوماً نشط وتراكمي</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TOP SELLING SERVICES & PACKAGES (الأكثر مبيعاً)                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box A: الخدمات الأكثر مبيعاً (Top Services) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">الخدمات الأكثر مبيعاً (Top Services)</h3>
                <p className="text-xs text-slate-400 mt-0.5">ترتيب الخدمات حسب أعلى مبيعات وأعلى عوائد صافية</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">TOP 5</span>
          </div>

          <div className="space-y-3.5">
            {topServices.length > 0 ? (
              topServices.map((svc, idx) => {
                const share = kpiMetrics.totalTransactions > 0 ? ((svc.count / kpiMetrics.totalTransactions) * 100).toFixed(0) : '0';
                return (
                  <div 
                    key={svc.name}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{svc.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{svc.count} طلب مكتمل</span>
                          <span>•</span>
                          <span className="text-amber-400 font-mono font-medium">{share}% من حجم الطلبات</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-sm font-mono font-black text-emerald-400">
                        +${svc.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        صافي الأرباح
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-500 gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-400">لا توجد مبيعات مسجلة لهذه الفترة بعد</div>
                <div className="text-[11px] text-slate-500">ستظهر الخدمات الأكثر طلباً تلقائياً فور تسجيل أول عملية مبيعات.</div>
              </div>
            )}
          </div>
        </div>

        {/* Box B: الباقات الأكثر طلباً (Top Packages) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">الباقات الأكثر طلباً (Top Packages)</h3>
                <p className="text-xs text-slate-400 mt-0.5">أعلى الباقات الرقمية طلباً ومعدل ربح كل باقة</p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">TOP 5</span>
          </div>

          <div className="space-y-3.5">
            {topPackages.length > 0 ? (
              topPackages.map((pkg, idx) => (
                <div 
                  key={`${pkg.serviceName}_${pkg.packageTitle}`}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {pkg.packageTitle}
                        <span className="text-xs font-normal text-slate-400 mr-2">({pkg.serviceName})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{pkg.count} عملية شحن</span>
                        <span>•</span>
                        <span>ربح الباقة: +${pkg.unitProfit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-sm font-mono font-black text-emerald-400">
                      +${pkg.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                      إجمالي ربح الباقة
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-500 gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-400">لا توجد باقات مباعة لهذه الفترة بعد</div>
                <div className="text-[11px] text-slate-500">سيتم تصنيف الباقات الرقمية الأكثر مبيعاً فور شحن أول رصيد.</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. DAILY ARCHIVE SYSTEM TABLE (سجل الأرشيف اليومي - 30 Days)        */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Table Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">سجل الأرشيف اليومي (Daily Archives - 30 Days)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                أرشيف تراكمي مفصل لكل يوم يتضمن حجم المبيعات الإجمالية، التكلفة، والأرباح الصافية
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 self-start sm:self-auto">
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>عرض السجلات: {filteredRecords.length} يوم</span>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-right text-xs min-w-[650px]">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4 text-center">عدد العمليات اليومية</th>
                <th className="p-4">إجمالي المبيعات ($)</th>
                <th className="p-4">تكلفة الجملة ($)</th>
                <th className="p-4">الربح الصافي ($)</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((rec) => (
                <tr 
                  key={rec.date}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  {/* 1. التاريخ */}
                  <td className="p-4">
                    <div className="font-bold text-white text-sm font-mono whitespace-nowrap">{rec.date}</div>
                    <div className="text-amber-400 text-xs mt-0.5 font-medium">يوم {rec.dayName}</div>
                  </td>

                  {/* 2. عدد العمليات اليومية */}
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold ${
                      rec.transactionCount > 0 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {rec.transactionCount} عملية
                    </span>
                  </td>

                  {/* 3. إجمالي المبيعات ($) */}
                  <td className="p-4 font-mono font-bold text-white text-sm">
                    ${rec.grossRevenue.toFixed(2)}
                  </td>

                  {/* 4. تكلفة الجملة ($) */}
                  <td className="p-4 font-mono text-slate-400">
                    ${rec.wholesaleCost.toFixed(2)}
                  </td>

                  {/* 5. الربح الصافي ($) */}
                  <td className="p-4 font-mono">
                    <div className={`font-black text-sm ${rec.netProfit > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      +${rec.netProfit.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {rec.profitMargin}% هامش
                    </div>
                  </td>

                  {/* 6. الإجراءات - تفاصيل المبيعات 🔍 */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayArchive(rec);
                          setModalSearchQuery('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs border border-amber-500/20 hover:border-amber-400 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
                        title="معاينة تفاصيل المبيعات لهذا اليوم"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفاصيل المبيعات 🔍</span>
                      </button>

                      {rec.items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDownloadDayReport(rec)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="تنزيل تقرير اليوم (CSV)"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PackageX className="w-8 h-8 text-slate-500" />
                      <span className="text-sm font-bold text-slate-300">لا توجد عمليات مبيعات مسجلة لهذا التاريخ بعد.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. REDESIGNED MODAL: تفاصيل مبيعات اليوم (MOBILE BOTTOM-SHEET OVERHAUL) */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {selectedDayArchive && (
          <div 
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4"
            onClick={() => setSelectedDayArchive(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 top-[75px] z-40 rounded-t-2xl md:relative md:inset-auto md:top-auto md:bottom-auto md:rounded-3xl bg-[#0F172A] border-t md:border border-slate-800 shadow-2xl overflow-hidden text-right flex flex-col h-[calc(100vh-75px)] md:h-auto md:max-h-[85vh] md:max-w-5xl md:w-full"
            >
              
              {/* 1. FIXED HEADER (flex-none p-4 pt-4 border-b border-slate-800) */}
              <div className="flex-none p-4 pt-4 border-b border-slate-800 flex items-center justify-between gap-2.5 bg-[#0F172A]">
                {/* Right side: Title & Date badge */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                    تفاصيل مبيعات يوم {selectedDayArchive.dayName}
                  </h3>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 whitespace-nowrap">
                    ({selectedDayArchive.date})
                  </span>
                </div>

                {/* Left side: Controls Row (Excel export + Close X) */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedDayArchive.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDownloadDayReport(selectedDayArchive)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 whitespace-nowrap shadow-sm"
                      title="تصدير تقرير مبيعات اليوم إلى ملف Excel منسق"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تصدير Excel 📊</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedDayArchive(null)}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 2. COMPACT KPI GRID (flex-none px-4 py-2 grid grid-cols-4 gap-2 bg-slate-900/50) */}
              <div className="flex-none px-4 py-2 grid grid-cols-4 gap-2 bg-slate-900/50 border-b border-slate-800/80">
                {/* 1. عدد العمليات */}
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 block truncate">عدد العمليات</span>
                  <span className="text-white font-black font-mono text-xs sm:text-sm">{selectedDayArchive.transactionCount}</span>
                </div>

                {/* 2. إجمالي المبيعات */}
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 block truncate">إجمالي المبيعات</span>
                  <span className="text-white font-black font-mono text-xs sm:text-sm">${selectedDayArchive.grossRevenue.toFixed(2)}</span>
                </div>

                {/* 3. تكلفة الجملة */}
                <div className="bg-slate-900/90 py-1.5 px-2 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 block truncate">تكلفة الجملة</span>
                  <span className="text-slate-300 font-black font-mono text-xs sm:text-sm">${selectedDayArchive.wholesaleCost.toFixed(2)}</span>
                </div>

                {/* 4. صافي الربح (Highlight Green) */}
                <div className="bg-emerald-950/40 py-1.5 px-2 rounded-xl border border-emerald-500/40 text-center flex flex-col justify-center">
                  <span className="text-[10px] sm:text-xs text-emerald-400 font-bold block truncate">صافي الربح</span>
                  <span className="text-emerald-400 font-black font-mono text-xs sm:text-sm">+${selectedDayArchive.netProfit.toFixed(2)}</span>
                </div>
              </div>

              {/* 3. EXPANDABLE & SCROLLABLE ORDER LIST CONTAINER (flex-1 overflow-y-auto p-4 min-h-0) */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {/* Search Bar */}
                {selectedDayArchive.items.length > 0 && (
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={e => setModalSearchQuery(e.target.value)}
                      placeholder="بحث برقم الطلب، اسم الخدمة، الباقة، أو معرف اللاعب..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Mobile Card Layout (block md:hidden) */}
                <div className="space-y-2.5 md:hidden">
                  {modalFilteredItems.map(item => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-2.5 text-right"
                    >
                      {/* Line 1: اسم الخدمة والباقة (Bold) | الوقت */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-black text-white text-sm truncate">
                            {item.serviceName}
                          </span>
                          <span className="text-amber-400 font-mono text-[11px] font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 truncate">
                            {item.packageTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 font-mono text-xs shrink-0">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.time}</span>
                        </div>
                      </div>

                      {/* Line 2: رقم الطلب | معرف اللاعب/الحساب */}
                      <div className="flex items-center justify-between text-xs border-y border-slate-800/70 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px]">رقم الطلب:</span>
                          <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.orderNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px]">معرف اللاعب:</span>
                          <span className="font-mono font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[130px]">
                            {item.recipientId}
                          </span>
                        </div>
                      </div>

                      {/* Line 3: سعر الجملة: $X | سعر البيع: $Y | الربح: +$Z (Emerald badge) */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>سعر الجملة: <strong className="font-mono text-slate-300">${item.wholesaleCost.toFixed(2)}</strong></span>
                          <span className="text-slate-600">•</span>
                          <span>سعر البيع: <strong className="font-mono text-white font-bold">${item.retailPrice.toFixed(2)}</strong></span>
                        </div>
                        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                          الربح: +${item.netProfit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout (hidden md:block) */}
                <div className="hidden md:block rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-3.5">الوقت</th>
                        <th className="p-3.5">رقم الطلب</th>
                        <th className="p-3.5">الخدمة والباقة</th>
                        <th className="p-3.5">معرف اللاعب</th>
                        <th className="p-3.5">سعر الجملة</th>
                        <th className="p-3.5">سعر البيع</th>
                        <th className="p-3.5">الربح الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {modalFilteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono text-slate-400 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{item.time}</span>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                              {item.orderNumber}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm">{item.serviceName}</div>
                            <div className="text-amber-400 font-mono text-xs mt-0.5">{item.packageTitle}</div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300 text-xs">
                            {item.recipientId}
                          </td>
                          <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                            ${item.wholesaleCost.toFixed(2)}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                            ${item.retailPrice.toFixed(2)}
                          </td>
                          <td className="p-3.5 font-mono font-black text-emerald-400 whitespace-nowrap">
                            +${item.netProfit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State message */}
                {modalFilteredItems.length === 0 && (
                  <div className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                        <Inbox className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-sm font-black text-slate-200">
                        لا توجد عمليات مبيعات مسجلة لهذا التاريخ بعد.
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        لم يتم تنفيذ أي شحنات أو طلبات في هذا اليوم. فور إتمام عمليات بيع للزبائن ستظهر هنا بالتفصيل.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. FIXED FOOTER BAR (flex-none p-4 bg-slate-900 border-t border-slate-800) */}
              <div className="flex-none p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-400 text-center sm:text-right w-full sm:w-auto">
                  إجمالي {selectedDayArchive.transactionCount} عملية مسجلة
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDayArchive(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm transition-all shadow-md active:scale-95 text-center border border-slate-700"
                >
                  إغلاق النافذة
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* SAFE DATA RESET CONFIRMATION MODAL WITH SECURITY CODE (h91164)    */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseResetModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-50 w-full max-w-md mx-auto bg-[#0F172A] border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-950/40 text-slate-100"
              dir="rtl"
            >
              {/* Top Warning Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
                  <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-black text-center text-white mb-2 leading-snug">
                تأكيد مسح وتصفير كافة السجلات والتقارير
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 text-center leading-relaxed mb-4">
                تحذير: هذا الإجراء سيقوم بحذف كافة عمليات الشحن، التقارير المالية، والأرشيف نهائياً ولا يمكن التراجع عنه.
              </p>

              {/* Instruction Label */}
              <div className="mb-2">
                <label className="block text-xs font-bold text-slate-300 text-right mb-1.5">
                  أدخل كود الأمان السري لتأكيد التصفير
                </label>
              </div>

              {/* Password/PIN Input Field with Show/Hide Toggle */}
              <div className="mb-5">
                <motion.div
                  animate={isInputShaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <input
                    type={showResetCode ? 'text' : 'password'}
                    value={resetSecurityCode}
                    onChange={(e) => {
                      setResetSecurityCode(e.target.value);
                      if (resetError) setResetError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmReset();
                      }
                    }}
                    placeholder="أدخل الرمز السري هنا..."
                    autoFocus
                    className={`bg-slate-900 border ${
                      resetError ? 'border-red-500 text-red-400 ring-2 ring-red-500/30' : 'border-slate-700 focus:border-red-500 text-white'
                    } text-center text-lg font-mono tracking-widest rounded-xl py-2.5 px-10 w-full outline-none transition-all placeholder:text-slate-500 placeholder:text-sm placeholder:font-sans`}
                  />

                  {/* Show/Hide Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowResetCode(!showResetCode)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 rounded-lg focus:outline-none"
                    title={showResetCode ? 'إخفاء الرمز' : 'إظهار الرمز'}
                  >
                    {showResetCode ? (
                      <EyeOff className="w-4 h-4 text-slate-400 hover:text-white" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                    )}
                  </button>
                </motion.div>

                {resetError && (
                  <p className="text-xs text-red-400 font-bold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>رمز الأمان السري غير صحيح!</span>
                  </p>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={
                    (resetSecurityCode || '').trim() !== REQUIRED_RESET_CODE &&
                    (resetSecurityCode || '').trim() !== (localStorage.getItem('gamepay_admin_pin') || '911164@').trim() &&
                    (resetSecurityCode || '').trim() !== '911164'
                  }
                  className={`flex-1 py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    (resetSecurityCode || '').trim() === REQUIRED_RESET_CODE ||
                    (resetSecurityCode || '').trim() === (localStorage.getItem('gamepay_admin_pin') || '911164@').trim() ||
                    (resetSecurityCode || '').trim() === '911164'
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 active:scale-95 cursor-pointer'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد التصفير النهائي 🗑️</span>
                </button>


                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all border border-slate-700"
                >
                  إلغاء ✖
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

