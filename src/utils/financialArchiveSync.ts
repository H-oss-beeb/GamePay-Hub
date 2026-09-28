import { INITIAL_SERVICES_DATA } from '../components/ProductsManager';

export interface ItemizedSale {
  id: string;
  orderNumber: string;
  time: string;
  serviceName: string;
  packageTitle: string;
  serviceImage?: string;
  recipientId: string;
  wholesaleCost: number;
  retailPrice: number;
  netProfit: number;
  supplier: string;
  status: 'completed' | 'refunded';
}

export interface DailyArchiveRecord {
  date: string; // YYYY-MM-DD
  dayName: string;
  transactionCount: number;
  grossRevenue: number;
  wholesaleCost: number;
  netProfit: number;
  profitMargin: number;
  items: ItemizedSale[];
}

export const ARABIC_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function getArabicDayName(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return ARABIC_DAY_NAMES[d.getDay()] || '';
  }
  return '';
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateZeroed30DaysArchive(): DailyArchiveRecord[] {
  const records: DailyArchiveRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = ARABIC_DAY_NAMES[d.getDay()];

    records.push({
      date: dateStr,
      dayName,
      transactionCount: 0,
      grossRevenue: 0,
      wholesaleCost: 0,
      netProfit: 0,
      profitMargin: 0,
      items: []
    });
  }

  return records;
}

export function getStoredFinancialArchives(): DailyArchiveRecord[] {
  const saved = localStorage.getItem('gamepay_financial_archives_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing financial archives:', e);
    }
  }
  const zeroed = generateZeroed30DaysArchive();
  localStorage.setItem('gamepay_financial_archives_v2', JSON.stringify(zeroed));
  return zeroed;
}

// Find package costs and prices
export function findServiceAndPackagePricing(serviceName: string, packageTitle: string) {
  let matchedService: any = null;
  let matchedPackage: any = null;

  try {
    const savedServices = localStorage.getItem('gamepay_services');
    const catalog = savedServices ? JSON.parse(savedServices) : INITIAL_SERVICES_DATA;
    if (Array.isArray(catalog)) {
      matchedService = catalog.find(
        (s: any) => (s?.name || '').toLowerCase().trim() === (serviceName || '').toLowerCase().trim()
      );
      if (matchedService && Array.isArray(matchedService.packages)) {
        matchedPackage = matchedService.packages.find(
          (p: any) => (p?.title || '').toLowerCase().trim() === (packageTitle || '').toLowerCase().trim()
        );
      }
    }
  } catch (e) {
    console.error('Error looking up pricing in services catalog:', e);
  }

  return { matchedService, matchedPackage };
}

// Real-time synchronization helper: append a completed order to today's dailySales
export function recordOrderToDailyFinancialArchive(orderPayload: any | any[]) {
  try {
    const rawOrders = Array.isArray(orderPayload) ? orderPayload : [orderPayload];
    if (rawOrders.length === 0) return;

    const currentArchives = getStoredFinancialArchives();
    const todayStr = getTodayDateString();
    const todayDayName = getArabicDayName(todayStr);

    let dayIndex = currentArchives.findIndex(r => r.date === todayStr);
    let todayRecord: DailyArchiveRecord;

    if (dayIndex === -1) {
      todayRecord = {
        date: todayStr,
        dayName: todayDayName,
        transactionCount: 0,
        grossRevenue: 0,
        wholesaleCost: 0,
        netProfit: 0,
        profitMargin: 0,
        items: []
      };
      currentArchives.unshift(todayRecord);
      dayIndex = 0;
    } else {
      todayRecord = { ...currentArchives[dayIndex] };
    }

    const newSales: ItemizedSale[] = [];

    for (const ord of rawOrders) {
      const orderId = ord.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

      // Prevent duplicate recording in items
      if (todayRecord.items.some(item => item.orderNumber === orderId)) {
        continue;
      }

      const sName = ord.serviceName || ord.gameType || 'خدمة ألعاب';
      const pTitle = ord.packageTier || ord.packageDetails || ord.packageTitle || 'باقة رقمية';
      const { matchedService, matchedPackage } = findServiceAndPackagePricing(sName, pTitle);

      let retail = ord.retailPrice;
      let wholesale = ord.wholesaleCost;

      if (typeof retail !== 'number' || isNaN(retail)) {
        if (matchedPackage && typeof matchedPackage.retailPrice === 'number') {
          retail = matchedPackage.retailPrice;
        } else if (ord.totalAmount) {
          // Convert from IQD at standard conversion 1,500 IQD = $1.00 USD
          retail = Number((ord.totalAmount / 1500).toFixed(2));
        } else {
          retail = 5.00;
        }
      }

      if (typeof wholesale !== 'number' || isNaN(wholesale)) {
        if (matchedPackage && typeof matchedPackage.wholesaleCost === 'number') {
          wholesale = matchedPackage.wholesaleCost;
        } else {
          // Default supplier margin: wholesale is approx 80% of retail price
          wholesale = Number((retail * 0.80).toFixed(2));
        }
      }

      const profit = Number((retail - wholesale).toFixed(2));
      const now = new Date();
      const timeStr = ord.time || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const saleItem: ItemizedSale = {
        id: `sale_${orderId}_${Date.now()}`,
        orderNumber: orderId,
        time: timeStr,
        serviceName: sName,
        packageTitle: pTitle,
        serviceImage: matchedService?.image,
        recipientId: ord.playerId || 'DIRECT',
        wholesaleCost: wholesale,
        retailPrice: retail,
        netProfit: profit,
        supplier: 'LikeCard B2B API',
        status: 'completed'
      };

      newSales.push(saleItem);
    }

    if (newSales.length === 0) return;

    // Prepend new sales
    const updatedItems = [...newSales, ...todayRecord.items];

    // Automatically recalculate summary metrics in real-time
    let totalRevenue = 0;
    let totalWholesale = 0;

    updatedItems.forEach(item => {
      totalRevenue += item.retailPrice;
      totalWholesale += item.wholesaleCost;
    });

    const netProfit = Number((totalRevenue - totalWholesale).toFixed(2));
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    currentArchives[dayIndex] = {
      ...todayRecord,
      transactionCount: updatedItems.length,
      grossRevenue: Number(totalRevenue.toFixed(2)),
      wholesaleCost: Number(totalWholesale.toFixed(2)),
      netProfit,
      profitMargin,
      items: updatedItems
    };

    localStorage.setItem('gamepay_financial_archives_v2', JSON.stringify(currentArchives));

    // Dispatch real-time events across windows & components
    window.dispatchEvent(new CustomEvent('gamepay_financial_updated', { detail: { newSales } }));
    window.dispatchEvent(new Event('orders_updated'));
  } catch (err) {
    console.error('Error recording order to daily financial archive:', err);
  }
}
