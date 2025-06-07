import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Order, ExportOptions } from '@/types';
import { formatPrice, formatDate } from './helpers';

// 订单导出为Excel
export const exportOrdersToExcel = (orders: Order[], options: ExportOptions = { format: 'excel', includeItems: true, includeCustomerInfo: true }) => {
  // 创建主要数据
  const mainData = orders.map(order => ({
    '订单号': order.orderNumber,
    '客户姓名': order.customerInfo.name,
    '客户公司': order.customerInfo.company,
    '联系方式': order.customerInfo.contact,
    '邮箱': order.customerInfo.email,
    '交货地址': order.customerInfo.deliveryAddress,
    '订单状态': getOrderStatusText(order.status),
    '订单日期': formatDate(order.orderDate),
    '确认日期': order.confirmedAt ? formatDate(order.confirmedAt) : '-',
    '交货日期': order.deliveryDate ? formatDate(order.deliveryDate) : '-',
    '原价总金额': formatPrice(order.originalAmount || order.totalAmount),
    '折扣金额': formatPrice(order.discountAmount || 0),
    '实际总金额': formatPrice(order.totalAmount),
    '支付方式': '对账单确认',
    '生产备注': order.productionNotes || '-',
    '特殊要求': order.customerInfo.specialRequirements || '-'
  }));

  // 创建详细商品数据（如果需要包含商品明细）
  let itemsData: any[] = [];
  if (options.includeItems) {
    orders.forEach(order => {
      order.items.forEach(item => {
        itemsData.push({
          '订单号': order.orderNumber,
          '产品编号': item.productCode,
          '产品名称': item.productName,
          '规格尺寸': item.selectedDimension,
          '颜色': item.selectedColor,
          '重量': `${item.weight}kg`,
          '包含个数': item.pieceCount,
          '订购数量': item.quantity,
          '原价单价': formatPrice(item.originalPrice || item.unitPrice),
          '折扣': `${item.discount || 0}%`,
          '折扣后单价': formatPrice(item.discountedPrice || item.unitPrice),
          '小计': formatPrice(item.subtotal)
        });
      });
    });
  }

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 添加订单汇总工作表
  const wsMain = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(wb, wsMain, '订单汇总');

  // 添加商品明细工作表（如果需要）
  if (options.includeItems && itemsData.length > 0) {
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, '商品明细');
  }

  // 生成文件名
  const fileName = `订单导出_${formatDate(new Date(), 'short').replace(/\//g, '-')}.xlsx`;
  
  // 下载文件
  XLSX.writeFile(wb, fileName);
};

// 生成打印友好的HTML
export const generatePrintableOrdersHTML = (orders: Order[], options: ExportOptions = { format: 'pdf', includeItems: true, includeCustomerInfo: true }) => {
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
      .header h1 { margin: 0; font-size: 24px; color: #333; }
      .header p { margin: 5px 0; color: #666; }
      .summary { margin-bottom: 30px; }
      .summary-item { display: inline-block; margin-right: 30px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
      .order { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
      .order-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
      .order-header h3 { margin: 0 0 10px 0; color: #333; }
      .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px; }
      .order-content { padding: 15px; }
      .customer-info { margin-bottom: 20px; }
      .customer-info h4 { margin: 0 0 10px 0; color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; }
      .info-row { margin-bottom: 5px; }
      .info-label { font-weight: bold; color: #333; }
      .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .items-table th { background: #f8f9fa; font-weight: bold; }
      .items-table tr:nth-child(even) { background: #f9f9f9; }
      .product-image { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
      .image-placeholder { width: 60px; height: 60px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px; }
      .status-badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px; }
      .status-pending { background: #ffc107; color: #000; }
      .status-confirmed { background: #17a2b8; }
      .status-production { background: #fd7e14; }
      .status-completed { background: #28a745; }
      .status-cancelled { background: #dc3545; }
      @media print {
        body { margin: 0; padding: 15px; }
        .order { page-break-inside: avoid; margin-bottom: 30px; }
      }
    </style>
  `;

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'production': return 'status-production';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const totalOrders = orders.length;

  const ordersHTML = orders.map(order => `
    <div class="order">
      <div class="order-header">
        <div class="order-info">
          <div>
            <h3>${order.orderNumber}</h3>
            <div class="info-row">
              <span class="info-label">订单日期:</span> ${formatDate(order.orderDate)}
            </div>
            ${order.confirmedAt ? `
              <div class="info-row">
                <span class="info-label">确认日期:</span> ${formatDate(order.confirmedAt)}
              </div>
            ` : ''}
            ${order.deliveryDate ? `
              <div class="info-row">
                <span class="info-label">交货日期:</span> ${formatDate(order.deliveryDate)}
              </div>
            ` : ''}
          </div>
          <div style="text-align: right;">
            <span class="status-badge ${getStatusClass(order.status)}">${getOrderStatusText(order.status)}</span>
          </div>
        </div>
      </div>
      
      <div class="order-content">
        ${options.includeCustomerInfo ? `
          <div class="customer-info">
            <h4>客户信息</h4>
            <div class="info-row"><span class="info-label">客户编号:</span> ${order.customerId}</div>
          </div>
        ` : ''}

        ${options.includeItems ? `
          <table class="items-table">
            <thead>
              <tr>
                <th>产品图片</th>
                <th>产品编号</th>
                <th>产品名称</th>
                <th>规格</th>
                <th>颜色</th>
                <th>数量</th>
                <th>重量(kg)</th>
                <th>包含个数</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    ${item.image ? 
                      `<img src="${item.image}" alt="${item.productCode}" class="product-image" />` : 
                      `<div class="image-placeholder">无图片</div>`
                    }
                  </td>
                  <td>${item.productCode}</td>
                  <td>${item.productName || '-'}</td>
                  <td>${item.selectedDimension}</td>
                  <td>${item.selectedColor}</td>
                  <td>${item.quantity}</td>
                  <td>${item.weight}</td>
                  <td>${item.pieceCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${order.productionNotes ? `
          <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <strong>生产备注:</strong> ${order.productionNotes}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>订单报表</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>订单报表</h1>
        <p>生成时间: ${formatDate(new Date())}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <strong>订单总数:</strong> ${totalOrders}
        </div>
      </div>

      ${ordersHTML}
    </body>
    </html>
  `;
};

// 导出订单为PDF (使用html2canvas + jsPDF)
export const exportOrdersToPDF = async (orders: Order[], options: ExportOptions = { format: 'pdf', includeItems: true, includeCustomerInfo: true }) => {
  // 创建临时div来生成HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = generatePrintableOrdersHTML(orders, options);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4宽度
  document.body.appendChild(tempDiv);

  try {
    // 使用html2canvas截图
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // 创建PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4宽度 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 如果内容超过一页，需要分页
    const pageHeight = 297; // A4高度 mm
    let position = 0;
    
    while (position < imgHeight) {
      if (position > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        -position,
        imgWidth,
        imgHeight
      );
      
      position += pageHeight;
    }

    // 生成文件名并下载
    const fileName = `订单报表_${formatDate(new Date(), 'short').replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
  } finally {
    // 清理临时元素
    document.body.removeChild(tempDiv);
  }
};

// 获取订单状态文本的辅助函数
function getOrderStatusText(status: string): string {
  switch (status) {
    case 'pending': return '待确认';
    case 'confirmed': return '已确认';
    case 'production': return '生产中';
    case 'completed': return '已完成';
    case 'cancelled': return '已取消';
    default: return '未知状态';
  }
} 