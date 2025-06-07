import type { Order, Contract, OrderItem } from '@/types';
import { formatPrice, formatDate, generateId } from './helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 默认合同条款模板
const DEFAULT_CONTRACT_TERMS = `
1. 交货条款：
   - 交货方式：送货上门
   - 交货时间：签订合同后15个工作日内
   - 交货地点：买方指定地址

2. 质量标准：
   - 产品符合国家相关质量标准
   - 提供质量检验报告
   - 质保期12个月

3. 付款条款：
   - 付款方式：对账单确认后付款
   - 付款期限：收到货物并验收合格后30天内

4. 违约责任：
   - 逾期交货：每延期一天，按合同总价的0.5%支付违约金
   - 质量问题：免费更换或退货

5. 其他条款：
   - 本合同一式两份，双方各执一份
   - 如有争议，通过友好协商解决
   - 合同自双方签字盖章之日起生效
`;

// 从订单生成合同
export const generateContractFromOrder = (order: Order, createdBy: string, customTerms?: string): Contract => {
  const contractNumber = generateContractNumber();
  
  const contract: Contract = {
    id: generateId(),
    contractNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerInfo: order.customerInfo,
    items: order.items,
    totalAmount: order.totalAmount,
    originalAmount: order.originalAmount || order.totalAmount,
    discountAmount: order.discountAmount || 0,
    terms: customTerms || DEFAULT_CONTRACT_TERMS,
    deliveryDate: order.deliveryDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 默认15天后
    createdAt: new Date(),
    createdBy,
    isActive: true
  };

  return contract;
};

// 生成合同编号
export const generateContractNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `HT${timestamp.slice(-8)}${random}`;
};

// 生成合同HTML内容
export const generateContractHTML = (contract: Contract): string => {
  const styles = `
    <style>
      body { 
        font-family: "SimSun", "Microsoft YaHei", Arial, sans-serif; 
        font-size: 14px; 
        line-height: 1.6; 
        margin: 0; 
        padding: 40px; 
        color: #333;
      }
      .contract-header { 
        text-align: center; 
        margin-bottom: 40px; 
        border-bottom: 3px solid #333; 
        padding-bottom: 20px; 
      }
      .contract-header h1 { 
        margin: 0; 
        font-size: 28px; 
        font-weight: bold; 
        color: #333; 
      }
      .contract-number { 
        margin-top: 10px; 
        font-size: 16px; 
        color: #666; 
      }
      .contract-info { 
        margin-bottom: 30px; 
      }
      .info-section { 
        margin-bottom: 25px; 
      }
      .info-section h3 { 
        margin: 0 0 15px 0; 
        font-size: 16px; 
        font-weight: bold; 
        color: #333; 
        border-bottom: 1px solid #ddd; 
        padding-bottom: 5px; 
      }
      .info-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 20px; 
        margin-bottom: 15px; 
      }
      .info-item { 
        display: flex; 
        align-items: flex-start; 
      }
      .info-label { 
        font-weight: bold; 
        min-width: 100px; 
        color: #333; 
      }
      .info-value { 
        flex: 1; 
      }
      .items-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0; 
      }
      .items-table th, .items-table td { 
        border: 1px solid #333; 
        padding: 10px; 
        text-align: left; 
        vertical-align: top; 
      }
      .items-table th { 
        background: #f8f9fa; 
        font-weight: bold; 
        text-align: center; 
      }
      .items-table .number-cell { 
        text-align: right; 
      }
      .total-section { 
        margin: 30px 0; 
        text-align: right; 
      }
      .total-row { 
        margin-bottom: 8px; 
        font-size: 16px; 
      }
      .total-final { 
        font-size: 18px; 
        font-weight: bold; 
        color: #d73527; 
        border-top: 2px solid #333; 
        padding-top: 10px; 
        margin-top: 15px; 
      }
      .terms-section { 
        margin: 40px 0; 
      }
      .terms-section h3 { 
        margin: 0 0 20px 0; 
        font-size: 18px; 
        font-weight: bold; 
        color: #333; 
      }
      .terms-content { 
        white-space: pre-line; 
        line-height: 1.8; 
        border: 1px solid #ddd; 
        padding: 20px; 
        background: #fafafa; 
      }
      .signature-section { 
        margin-top: 60px; 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 80px; 
      }
      .signature-box { 
        text-align: center; 
      }
      .signature-title { 
        font-weight: bold; 
        margin-bottom: 40px; 
        font-size: 16px; 
      }
      .signature-line { 
        border-bottom: 1px solid #333; 
        height: 50px; 
        margin-bottom: 10px; 
        position: relative; 
      }
      .signature-label { 
        font-size: 14px; 
        color: #666; 
      }
      .page-break { 
        page-break-before: always; 
      }
      @media print {
        body { margin: 0; padding: 20px; }
        .page-break { page-break-before: always; }
      }
    </style>
  `;

  const itemsHTML = contract.items.map((item, index) => `
    <tr>
      <td style="text-align: center;">${index + 1}</td>
      <td>${item.productCode}</td>
      <td>${item.productName || '-'}</td>
      <td style="text-align: center;">${item.selectedDimension}</td>
      <td style="text-align: center;">${item.selectedColor}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td class="number-cell">${formatPrice(item.originalPrice || item.unitPrice)}</td>
      <td style="text-align: center;">${item.discount || 0}%</td>
      <td class="number-cell">${formatPrice(item.discountedPrice || item.unitPrice)}</td>
      <td class="number-cell">${formatPrice(item.subtotal)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>销售合同 - ${contract.contractNumber}</title>
      ${styles}
    </head>
    <body>
      <div class="contract-header">
        <h1>产品销售合同</h1>
        <div class="contract-number">合同编号：${contract.contractNumber}</div>
      </div>

      <div class="contract-info">
        <div class="info-section">
          <h3>合同基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">合同编号：</span>
              <span class="info-value">${contract.contractNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">签订日期：</span>
              <span class="info-value">${formatDate(contract.createdAt, 'short')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">关联订单：</span>
              <span class="info-value">${contract.orderNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预计交货：</span>
              <span class="info-value">${formatDate(contract.deliveryDate, 'short')}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>买方信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">客户姓名：</span>
              <span class="info-value">${contract.customerInfo.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">客户公司：</span>
              <span class="info-value">${contract.customerInfo.company}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话：</span>
              <span class="info-value">${contract.customerInfo.contact}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电子邮箱：</span>
              <span class="info-value">${contract.customerInfo.email}</span>
            </div>
          </div>
          <div class="info-item" style="margin-top: 10px;">
            <span class="info-label">交货地址：</span>
            <span class="info-value">${contract.customerInfo.deliveryAddress}</span>
          </div>
          ${contract.customerInfo.specialRequirements ? `
            <div class="info-item" style="margin-top: 10px;">
              <span class="info-label">特殊要求：</span>
              <span class="info-value">${contract.customerInfo.specialRequirements}</span>
            </div>
          ` : ''}
        </div>

        <div class="info-section">
          <h3>卖方信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">公司名称：</span>
              <span class="info-value">杭州攀岩定制有限公司</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话：</span>
              <span class="info-value">0571-8888-8888</span>
            </div>
            <div class="info-item">
              <span class="info-label">公司地址：</span>
              <span class="info-value">浙江省杭州市西湖区文三路123号</span>
            </div>
            <div class="info-item">
              <span class="info-label">电子邮箱：</span>
              <span class="info-value">sales@panyandingzhi.com</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>产品明细</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;">序号</th>
              <th style="width: 100px;">产品编号</th>
              <th style="width: 120px;">产品名称</th>
              <th style="width: 80px;">规格尺寸</th>
              <th style="width: 60px;">颜色</th>
              <th style="width: 60px;">数量</th>
              <th style="width: 80px;">原价单价</th>
              <th style="width: 60px;">折扣</th>
              <th style="width: 80px;">折扣后单价</th>
              <th style="width: 80px;">小计金额</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          ${contract.originalAmount > contract.totalAmount ? `
            <div class="total-row">原价总金额：${formatPrice(contract.originalAmount)}</div>
            <div class="total-row">折扣金额：-${formatPrice(contract.discountAmount)}</div>
          ` : ''}
          <div class="total-final">合同总金额：${formatPrice(contract.totalAmount)}</div>
        </div>
      </div>

      <div class="terms-section">
        <h3>合同条款</h3>
        <div class="terms-content">${contract.terms}</div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-title">买方（盖章）</div>
          <div class="signature-line"></div>
          <div class="signature-label">法定代表人或授权代表签字</div>
          <div style="margin-top: 20px;">
            <div class="signature-line"></div>
            <div class="signature-label">签订日期</div>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-title">卖方（盖章）</div>
          <div class="signature-line"></div>
          <div class="signature-label">法定代表人或授权代表签字</div>
          <div style="margin-top: 20px;">
            <div class="signature-line"></div>
            <div class="signature-label">签订日期</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 将合同导出为PDF
export const exportContractToPDF = async (contract: Contract): Promise<void> => {
  // 创建临时div来生成HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = generateContractHTML(contract);
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
    const fileName = `销售合同_${contract.contractNumber}.pdf`;
    pdf.save(fileName);
  } finally {
    // 清理临时元素
    document.body.removeChild(tempDiv);
  }
};

// 验证合同数据
export const validateContract = (contract: Partial<Contract>): string[] => {
  const errors: string[] = [];

  if (!contract.customerInfo?.name) {
    errors.push('客户姓名不能为空');
  }

  if (!contract.customerInfo?.company) {
    errors.push('客户公司不能为空');
  }

  if (!contract.customerInfo?.contact) {
    errors.push('联系方式不能为空');
  }

  if (!contract.customerInfo?.deliveryAddress) {
    errors.push('交货地址不能为空');
  }

  if (!contract.items || contract.items.length === 0) {
    errors.push('产品明细不能为空');
  }

  if (!contract.totalAmount || contract.totalAmount <= 0) {
    errors.push('合同金额必须大于0');
  }

  if (!contract.deliveryDate) {
    errors.push('交货日期不能为空');
  }

  if (!contract.terms || contract.terms.trim() === '') {
    errors.push('合同条款不能为空');
  }

  return errors;
}; 