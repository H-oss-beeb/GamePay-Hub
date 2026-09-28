import XLSX from 'xlsx-js-style';
import type { DailyArchiveRecord, ItemizedSale } from './financialArchiveSync';

interface ExcelCellStyle {
  fill?: { fgColor?: { rgb?: string } };
  font?: { name?: string; sz?: number; bold?: boolean; color?: { rgb?: string } };
  alignment?: { horizontal?: 'left' | 'center' | 'right'; vertical?: 'top' | 'center' | 'bottom'; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
}

const thinBorder = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } }
};

const headerStyle: ExcelCellStyle = {
  fill: { fgColor: { rgb: '0F172A' } }, // Dark Navy Blue #0F172A
  font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'medium', color: { rgb: '0F172A' } },
    bottom: { style: 'medium', color: { rgb: '0F172A' } },
    left: { style: 'thin', color: { rgb: '334155' } },
    right: { style: 'thin', color: { rgb: '334155' } }
  }
};

const centerDataStyle: ExcelCellStyle = {
  font: { name: 'Calibri', sz: 11, color: { rgb: '1E293B' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder
};

const rightDataStyle: ExcelCellStyle = {
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
  alignment: { horizontal: 'right', vertical: 'center' },
  border: thinBorder
};

const priceDataStyle: ExcelCellStyle = {
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder
};

const profitDataStyle: ExcelCellStyle = {
  fill: { fgColor: { rgb: 'F0FDF4' } },
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '15803D' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder
};

// Subtle Emerald Green #DCFCE7 for summary rows
const summaryHeaderStyle: ExcelCellStyle = {
  fill: { fgColor: { rgb: 'DCFCE7' } },
  font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '14532D' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'medium', color: { rgb: '16A34A' } },
    bottom: { style: 'medium', color: { rgb: '16A34A' } },
    left: { style: 'thin', color: { rgb: '86EFAC' } },
    right: { style: 'thin', color: { rgb: '86EFAC' } }
  }
};

const summaryPriceStyle: ExcelCellStyle = {
  fill: { fgColor: { rgb: 'DCFCE7' } },
  font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '14532D' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'medium', color: { rgb: '16A34A' } },
    bottom: { style: 'medium', color: { rgb: '16A34A' } },
    left: { style: 'thin', color: { rgb: '86EFAC' } },
    right: { style: 'thin', color: { rgb: '86EFAC' } }
  }
};

// Helper: Export Single Day's Itemized Sales to Excel
export function exportDaySalesToExcel(dayRecord: DailyArchiveRecord) {
  const wb = XLSX.utils.book_new();
  const ws: any = {};

  const headers = [
    'الوقت',
    'رقم الطلب',
    'اسم الخدمة',
    'تفاصيل الباقة',
    'معرف اللاعب / المستلم',
    'سعر الجملة',
    'سعر البيع',
    'الربح الصافي',
    'حالة العملية'
  ];

  const colWidths = [12, 18, 22, 22, 18, 16, 16, 16, 14];

  // Set Headers (Row 0)
  headers.forEach((header, c) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    ws[cellRef] = {
      v: header,
      t: 's',
      s: headerStyle
    };
  });

  const rowHeights: { hpt: number }[] = [{ hpt: 30 }];

  // Data Rows
  let r = 1;
  const items = dayRecord.items || [];

  items.forEach((item: ItemizedSale) => {
    rowHeights.push({ hpt: 24 });

    const rowData = [
      { v: item.time, t: 's', s: centerDataStyle },
      { v: item.orderNumber, t: 's', s: centerDataStyle },
      { v: item.serviceName, t: 's', s: rightDataStyle },
      { v: item.packageTitle, t: 's', s: rightDataStyle },
      { v: item.recipientId, t: 's', s: centerDataStyle },
      { v: `$${item.wholesaleCost.toFixed(2)}`, t: 's', s: priceDataStyle },
      { v: `$${item.retailPrice.toFixed(2)}`, t: 's', s: priceDataStyle },
      { v: `+$${item.netProfit.toFixed(2)}`, t: 's', s: profitDataStyle },
      { v: item.status === 'completed' ? 'مكتمل' : 'مسترجع', t: 's', s: centerDataStyle }
    ];

    rowData.forEach((cell, c) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      ws[cellRef] = cell;

      // Adjust column width dynamically if content exceeds default
      const textLen = (cell.v || '').toString().length + 4;
      if (textLen > colWidths[c]) {
        colWidths[c] = Math.min(textLen, 40);
      }
    });

    r++;
  });

  // Empty state row if no items
  if (items.length === 0) {
    rowHeights.push({ hpt: 26 });
    const cellRef = XLSX.utils.encode_cell({ r, c: 0 });
    ws[cellRef] = {
      v: 'لا توجد مبيعات مسجلة لهذا اليوم',
      t: 's',
      s: {
        font: { name: 'Calibri', sz: 11, italic: true, color: { rgb: '64748B' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      }
    };
    for (let c = 1; c < headers.length; c++) {
      ws[XLSX.utils.encode_cell({ r, c })] = { v: '', t: 's', s: centerDataStyle };
    }
    r++;
  }

  // Bottom Summary Row: إجمالي مبيعات اليوم
  rowHeights.push({ hpt: 30 });
  const summaryCells = [
    { v: 'إجمالي مبيعات اليوم', t: 's', s: summaryHeaderStyle },
    { v: `${dayRecord.transactionCount} طلبات`, t: 's', s: summaryHeaderStyle },
    { v: '-', t: 's', s: summaryHeaderStyle },
    { v: '-', t: 's', s: summaryHeaderStyle },
    { v: '-', t: 's', s: summaryHeaderStyle },
    { v: `$${dayRecord.wholesaleCost.toFixed(2)}`, t: 's', s: summaryPriceStyle },
    { v: `$${dayRecord.grossRevenue.toFixed(2)}`, t: 's', s: summaryPriceStyle },
    { v: `+$${dayRecord.netProfit.toFixed(2)}`, t: 's', s: summaryPriceStyle },
    { v: `هامش ${dayRecord.profitMargin}%`, t: 's', s: summaryHeaderStyle }
  ];

  summaryCells.forEach((cell, c) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    ws[cellRef] = cell;
  });
  r++;

  // Metadata & Properties
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: headers.length - 1 } });
  ws['!views'] = [{ RTL: true }];
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  ws['!rows'] = rowHeights;

  const sheetName = `مبيعات_${dayRecord.date}`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `GamePay_Daily_Report_${dayRecord.date}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Helper: Export General Archive Summary Table to Excel
export function exportArchiveSummaryToExcel(records: DailyArchiveRecord[], filterLabel: string) {
  const wb = XLSX.utils.book_new();
  const ws: any = {};

  const headers = [
    'التاريخ',
    'اليوم',
    'عدد العمليات اليومية',
    'إجمالي المبيعات ($)',
    'تكلفة الجملة ($)',
    'الربح الصافي ($)',
    'نسبة الهامش %'
  ];

  const colWidths = [16, 14, 22, 20, 20, 20, 16];
  const rowHeights: { hpt: number }[] = [{ hpt: 30 }];

  // Headers (Row 0)
  headers.forEach((header, c) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    ws[cellRef] = {
      v: header,
      t: 's',
      s: headerStyle
    };
  });

  let r = 1;
  let totalOps = 0;
  let totalRev = 0;
  let totalCost = 0;
  let totalProfit = 0;

  records.forEach(rec => {
    rowHeights.push({ hpt: 24 });
    totalOps += rec.transactionCount;
    totalRev += rec.grossRevenue;
    totalCost += rec.wholesaleCost;
    totalProfit += rec.netProfit;

    const rowData = [
      { v: rec.date, t: 's', s: centerDataStyle },
      { v: rec.dayName, t: 's', s: centerDataStyle },
      { v: `${rec.transactionCount} عملية`, t: 's', s: centerDataStyle },
      { v: `$${rec.grossRevenue.toFixed(2)}`, t: 's', s: priceDataStyle },
      { v: `$${rec.wholesaleCost.toFixed(2)}`, t: 's', s: priceDataStyle },
      { v: `+$${rec.netProfit.toFixed(2)}`, t: 's', s: profitDataStyle },
      { v: `${rec.profitMargin}%`, t: 's', s: centerDataStyle }
    ];

    rowData.forEach((cell, c) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      ws[cellRef] = cell;

      const textLen = (cell.v || '').toString().length + 4;
      if (textLen > colWidths[c]) {
        colWidths[c] = Math.min(textLen, 35);
      }
    });

    r++;
  });

  // Highlighted Bottom Summary Row
  rowHeights.push({ hpt: 30 });
  const overallMargin = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0.0';

  const summaryCells = [
    { v: `إجمالي تقرير (${filterLabel})`, t: 's', s: summaryHeaderStyle },
    { v: '-', t: 's', s: summaryHeaderStyle },
    { v: `${totalOps} عملية إجمالية`, t: 's', s: summaryHeaderStyle },
    { v: `$${totalRev.toFixed(2)}`, t: 's', s: summaryPriceStyle },
    { v: `$${totalCost.toFixed(2)}`, t: 's', s: summaryPriceStyle },
    { v: `+$${totalProfit.toFixed(2)}`, t: 's', s: summaryPriceStyle },
    { v: `هامش ${overallMargin}%`, t: 's', s: summaryHeaderStyle }
  ];

  summaryCells.forEach((cell, c) => {
    const cellRef = XLSX.utils.encode_cell({ r, c });
    ws[cellRef] = cell;
  });
  r++;

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: headers.length - 1 } });
  ws['!views'] = [{ RTL: true }];
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  ws['!rows'] = rowHeights;

  XLSX.utils.book_append_sheet(wb, ws, 'أرشيف_المبيعات');

  const filename = `GamePay_Archive_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
