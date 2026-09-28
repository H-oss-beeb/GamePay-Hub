import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const renderReceiptTemplate = (order: any) => {
  const isDeposit = order.isDeposit || 
    (order.id && String(order.id).startsWith('DEP-')) || 
    (order.serviceName && (order.serviceName.includes('شحن') || order.serviceName.includes('إيداع')));
  
  const titleHeader = isDeposit ? 'إشعار شحن محفظة - سند إيداع رقمي' : 'إشعار شحن تلقائي - فاتورة رقمية';
  const amountPrefix = isDeposit ? '+' : '-';
  const usdFormatted = order.usdAmount ? `$${Number(order.usdAmount).toFixed(2)} USD` : (order.retailPrice ? `$${Number(order.retailPrice).toFixed(2)} USD` : '');
  const iqdFormatted = order.totalAmount ? `${order.totalAmount?.toLocaleString()} د.ع` : (order.iqdAmount ? `${order.iqdAmount?.toLocaleString()} د.ع` : '');

  const hasDiscount = Boolean(order.onSale && (order.discountPercent || 0) > 0);
  const origPriceNum = Number(order.originalPrice || 0);
  const currentPriceNum = Number(order.usdAmount || order.retailPrice || 0);
  const savingsUSD = hasDiscount && origPriceNum > currentPriceNum ? (origPriceNum - currentPriceNum).toFixed(2) : null;

  return `
  <div id="receipt-print-area" style="
    width: 600px;
    padding: 40px;
    background: #090d16;
    color: #ffffff;
    font-family: 'Cairo', 'Tajawal', sans-serif;
    direction: rtl;
    border: 1px solid #1e293b;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8);
  ">
    <!-- HEADER -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px;">
      <div>
        <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">GamePay</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">${titleHeader}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${hasDiscount ? `
          <div style="background: rgba(244, 63, 94, 0.2); border: 1px solid #f43f5e; color: #fb7185; padding: 6px 12px; border-radius: 50px; font-weight: bold; font-size: 13px;">
            🔥 خصم ${order.discountPercent}%
          </div>
        ` : ''}
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; padding: 6px 16px; border-radius: 50px; font-weight: bold; font-size: 14px;">
          ✓ عملية مكتملة ومؤكدة
        </div>
      </div>
    </div>

    <!-- PROMOTIONAL DISCOUNT BANNER -->
    ${hasDiscount ? `
      <div style="background: rgba(244, 63, 94, 0.08); border: 1px dashed rgba(244, 63, 94, 0.4); padding: 12px 18px; border-radius: 12px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #fb7185; font-size: 13px; font-weight: bold;">
          🎉 تم تطبيق عرض ترويجي خاص (${order.discountPercent}%)
        </span>
        <span style="color: #cbd5e1; font-size: 12px; font-family: monospace;">
          السعر الأصلي: <span style="text-decoration: line-through; color: #94a3b8;">$${origPriceNum.toFixed(2)} USD</span>
          ${savingsUSD ? `<strong style="color: #34d399; margin-right: 8px;">(وفرت $${savingsUSD} USD)</strong>` : ''}
        </span>
      </div>
    ` : ''}

    <!-- DETAILS GRID -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px;">
      <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
        <span style="color: #94a3b8; font-size: 12px; display: block;">رقم المعاملة / الطلب</span>
        <strong style="color: #38bdf8; font-size: 16px;">${order.id}</strong>
      </div>
      <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
        <span style="color: #94a3b8; font-size: 12px; display: block;">التاريخ والوقت</span>
        <strong style="color: #e2e8f0; font-size: 14px;">${order.date || '2026/09/21'}</strong>
      </div>
      <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
        <span style="color: #94a3b8; font-size: 12px; display: block;">نوع العملية / الخدمة</span>
        <strong style="color: #ffffff; font-size: 15px;">${order.serviceName || (isDeposit ? 'شحن رصيد المحفظة الإلكترونية' : 'مشتريات رقمية')}</strong>
      </div>
      <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
        <span style="color: #94a3b8; font-size: 12px; display: block;">معرف المستفيد / الحساب</span>
        <strong style="color: #f59e0b; font-size: 15px; font-family: monospace;">${order.playerId || 'محفظة GamePay الإلكترونية'}</strong>
      </div>
      <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
        <span style="color: #94a3b8; font-size: 12px; display: block;">الباقة / البند</span>
        <strong style="color: #ffffff; font-size: 15px;">${order.packageTier || (isDeposit ? 'إيداع رصيد فوري' : 'باقة شحن ألعاب')}</strong>
      </div>
      <div style="background: #0f172a; padding: 14px; border-radius: 12px; border: 1px solid #1e293b;">
        <span style="color: #94a3b8; font-size: 12px; display: block;">طريقة الدفع</span>
        <strong style="color: #a855f7; font-size: 15px;">${order.paymentMethod || 'محفظة GamePay'}</strong>
      </div>
    </div>

    <!-- TOTAL AMOUNT -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 20px; border-radius: 16px; border: 1px solid #6366f1; text-align: center;">
      <span style="color: #c7d2fe; font-size: 14px; display: block; margin-bottom: 4px;">
        ${hasDiscount ? 'المبلغ الإجمالي بعد الخصم الترويجي' : 'المبلغ الإجمالي للمعاملة'}
      </span>
      <strong style="color: ${isDeposit ? '#34d399' : '#f59e0b'}; font-size: 26px; font-weight: 900; font-family: monospace;">
        ${amountPrefix}${usdFormatted ? usdFormatted : ''} ${iqdFormatted ? `(~${iqdFormatted})` : ''}
      </strong>
      ${typeof order.snapshotBalance === 'number' ? `
        <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
          الرصيد المتبقي في المحفظة: <strong style="color: #34d399; font-family: monospace;">$${Number(order.snapshotBalance).toFixed(2)} USD</strong>
        </div>
      ` : ''}
    </div>

    <!-- FOOTER -->
    <div style="margin-top: 30px; text-align: center; color: #475569; font-size: 11px;">
      شكراً لاستخدامك GamePay • الدعم الفني المباشر عبر واتساب: 07714783453
    </div>
  </div>
  `;
};

export const downloadPDFReceipt = async (order: any) => {
  // 1. Create temporary off-screen container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.innerHTML = renderReceiptTemplate(order);
  document.body.appendChild(container);

  const target = document.getElementById('receipt-print-area');
  
  if (!target) return;

  try {
    // 2. Capture styled HTML as high-res canvas
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#090d16' });
    const imgData = canvas.toDataURL('image/png');

    // 3. Output to crisp PDF file
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(`GamePay_Receipt_${order.id}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  } finally {
    // Clean up DOM
    document.body.removeChild(container);
  }
};
