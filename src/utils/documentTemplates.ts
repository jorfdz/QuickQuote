import { formatCurrency, formatDate } from '../data/mockData';
import { DEFAULT_DOCUMENT_TEMPLATES } from '../data/documentSettings';
import type { CompanySettings, Contact, Customer, DocumentTemplates, Invoice, Order, PurchaseOrder, Quote, User, Vendor } from '../types';

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const replaceTokens = (template: string, data: Record<string, string>): string => {
  let rendered = template;

  Object.entries(data).forEach(([key, value]) => {
    rendered = rendered.split(key).join(value);
  });

  return rendered;
};

const ensureHtmlDocument = (html: string): string => {
  if (/<html[\s>]/i.test(html)) {
    return html;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body>
${html}
</body>
</html>`;
};

const ensureWorkOrderQrMarkup = (template: string): string => {
  const html = ensureHtmlDocument(template);

  if (typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const header = doc.querySelector('.header');

  if (!header) {
    return html;
  }

  const children = Array.from(header.children);
  const companyBlock = children[0] || null;

  while (header.firstChild) {
    header.removeChild(header.firstChild);
  }

  if (companyBlock) {
    header.appendChild(companyBlock);
  }

  const headerRight = doc.createElement('div');
  headerRight.className = 'header-right';
  headerRight.innerHTML = `
    <div class="header-copy">
      <div class="doc-title">WORK ORDER</div>
      <div class="doc-number">{{orderNumber}}</div>
    </div>
    <div class="qr-box">
      <img src="{{qrCodeUrl}}" alt="Work order QR code" />
    </div>
  `;
  header.appendChild(headerRight);

  doc.querySelectorAll('.qr-caption, .work-order-qr-fallback').forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    .header { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; border-bottom: 2px solid #1f2937 !important; padding-bottom: 34px !important; margin-bottom: 28px !important; }
    .header-right { display: flex !important; align-items: flex-start !important; justify-content: flex-end !important; gap: 18px !important; width: 320px !important; }
    .header-copy { text-align: right !important; padding-top: 2px !important; width: 218px !important; flex: 0 0 218px !important; }
    .qr-box { width: 84px !important; text-align: center !important; flex-shrink: 0 !important; }
    .qr-box img { width: 84px !important; height: 84px !important; display: block !important; border: 1px solid #e5e7eb !important; border-radius: 8px !important; background: #fff !important; }
  `;
  doc.head.appendChild(style);

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
};

const buildCompanyAddress = (company: CompanySettings): string => (
  [
    company.address,
    [company.city, company.state].filter(Boolean).join(', '),
    company.zip,
  ].filter(Boolean).join(' ')
);

const buildQuoteLineItemsHtml = (quote: Quote): string => quote.lineItems.map((item, index) => {
  const unitPrice = item.quantity > 0 ? item.sellPrice / item.quantity : item.sellPrice;
  const details = [
    item.width && item.height ? `${item.width}" x ${item.height}"` : '',
    item.productFamily ? item.productFamily.replace(/_/g, ' ') : '',
  ].filter(Boolean).join(' · ');

  return `<tr${index % 2 === 1 ? ' style="background:#f9fafb"' : ''}>
    <td>
      <div style="font-weight:600; color:#111827;">${escapeHtml(item.description)}</div>
      ${details ? `<div style="font-size:11px; color:#9ca3af; margin-top:4px;">${escapeHtml(details)}</div>` : ''}
    </td>
    <td style="text-align:center;">${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</td>
    <td style="text-align:right;">${escapeHtml(formatCurrency(unitPrice))}</td>
    <td style="text-align:right;">${escapeHtml(formatCurrency(item.sellPrice))}</td>
  </tr>`;
}).join('');

const buildInvoiceLineItemsHtml = (invoice: Invoice): string => invoice.lineItems.map((item, index) => {
  const details = item.orderId ? `Source Order: ${item.orderId}` : '';

  return `<tr${index % 2 === 1 ? ' style="background:#f9fafb"' : ''}>
    <td>
      <div style="font-weight:600; color:#111827;">${escapeHtml(item.description)}</div>
      ${details ? `<div style="font-size:11px; color:#9ca3af; margin-top:4px;">${escapeHtml(details)}</div>` : ''}
    </td>
    <td style="text-align:center;">${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</td>
    <td style="text-align:right;">${escapeHtml(formatCurrency(item.unitPrice))}</td>
    <td style="text-align:right;">${escapeHtml(formatCurrency(item.total))}</td>
  </tr>`;
}).join('');

const buildPurchaseOrderLineItemsHtml = (purchaseOrder: PurchaseOrder): string => purchaseOrder.items.map((item, index) => (
  `<tr${index % 2 === 1 ? ' style="background:#f9fafb"' : ''}>
    <td>${escapeHtml(item.description)}</td>
    <td style="text-align:center;">${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</td>
    <td style="text-align:right;">${escapeHtml(formatCurrency(item.unitCost))}</td>
    <td style="text-align:right;">${escapeHtml(formatCurrency(item.total))}</td>
  </tr>`
)).join('');

const buildWorkOrderItemsHtml = (order: Order, itemQrCodeUrls: Record<string, string> = {}): string => order.lineItems.map((item, index) => {
  const productionLines = [
    item.width && item.height ? `Final size: ${item.width}" x ${item.height}"` : '',
    item.productFamily ? `Family: ${item.productFamily.replace(/_/g, ' ')}` : '',
    item.equipmentName ? `Equipment: ${item.equipmentName}` : '',
    item.runTime ? `Runtime: ${item.runTime} hr` : '',
  ].filter(Boolean);
  const productionDetails = productionLines.join('<br>');

  const materialsAndServices = [
    item.materialName ? `Material: ${item.materialName}` : '',
    item.vendorCost ? `Outside service: ${formatCurrency(item.vendorCost)}` : '',
    item.laborHours ? `Labor: ${item.laborHours} hr @ ${item.laborRate ? formatCurrency(item.laborRate) : 'Assigned rate'}` : '',
    item.additionalCost ? `Additional service notes required` : '',
    item.notes ? `Notes: ${escapeHtml(item.notes)}` : '',
  ].filter(Boolean).join('<br>');

  const inlineSpecMarkup = productionLines.length > 0
    ? `<div style="margin-top:8px; font-size:10px; line-height:1.35; color:#64748b;">
        ${productionLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
      </div>`
    : '';

  const itemQrMarkup = (order.trackingMode || 'order') === 'item' && itemQrCodeUrls[item.id]
    ? `
      <div style="margin-top:2px; display:flex; align-items:flex-start; justify-content:space-between; gap:18px; width:100%;">
        <div style="min-width:0; flex:1 1 auto; padding-top:2px;">
          <div style="font-size:13px; font-weight:700; color:#111827; line-height:1.2;">${escapeHtml(item.description)}</div>
          <div style="margin-top:5px; font-size:11px; line-height:1.25; color:#64748b;">Qty ${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</div>
          ${inlineSpecMarkup}
        </div>
        <img src="${escapeHtml(itemQrCodeUrls[item.id])}" alt="Item tracker QR code" style="width:68px; height:68px; border-radius:8px; border:1px solid #dbeafe; background:#ffffff; flex:0 0 68px; margin-left:auto;" />
      </div>
    `
    : '';

  return `<tr style="${index > 0 ? 'border-top:2px solid #e5e7eb;' : ''}${index % 2 === 1 ? ' background:#f9fafb;' : ''}">
    <td style="padding-top:16px; padding-bottom:16px;">
      ${(order.trackingMode || 'order') === 'item'
        ? itemQrMarkup
        : `<div class="item-title">${escapeHtml(item.description)}</div>
      <span class="item-meta">Qty ${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</span>`}
    </td>
    <td style="padding-top:20px; padding-bottom:20px; font-size:10px; line-height:1.35; color:#64748b;">${(order.trackingMode || 'order') === 'item' ? '' : (productionDetails || '&mdash;')}</td>
    <td style="padding-top:20px; padding-bottom:20px; font-size:10px; line-height:1.35; color:#64748b;">${materialsAndServices || '&mdash;'}</td>
  </tr>`;
}).join('');

export const buildQuoteTemplateHtml = ({
  template,
  company,
  quote,
  customer,
  contact,
  assignedUser,
}: {
  template: DocumentTemplates['quote'];
  company: CompanySettings;
  quote: Quote;
  customer: Customer | null;
  contact: Contact | null;
  assignedUser: User | null;
}): string => {
  const effectiveTemplate = template || DEFAULT_DOCUMENT_TEMPLATES.quote;
  const companyAddress = buildCompanyAddress(company);
  const validUntil = quote.validUntil ? formatDate(quote.validUntil) : 'Upon receipt';
  const contactName = contact ? `${contact.firstName} ${contact.lastName}`.trim() : '';
  const preparedBy = assignedUser
    ? `${assignedUser.firstName || assignedUser.name.split(' ')[0]} ${assignedUser.lastName || assignedUser.name.split(' ').slice(1).join(' ')}`
        .trim()
    : '';

  const customerBlock = [
    customer?.name || quote.customerName || '',
    contactName ? `Attn: ${contactName}${contact?.title ? `, ${contact.title}` : ''}` : '',
    customer?.address || '',
    `${[customer?.city, customer?.state].filter(Boolean).join(', ')}${customer?.zip ? ` ${customer.zip}` : ''}`.trim(),
    contact?.email || '',
    contact?.phone || '',
  ].filter(Boolean).map(escapeHtml).join('<br>');

  return ensureHtmlDocument(replaceTokens(effectiveTemplate, {
    '{{companyName}}': escapeHtml(company.name),
    '{{companyAddress}}': escapeHtml(companyAddress),
    '{{companyPhone}}': escapeHtml(company.phone),
    '{{companyEmail}}': escapeHtml(company.email),
    '{{quoteNumber}}': escapeHtml(quote.number),
    '{{customerName}}': escapeHtml(customer?.name || quote.customerName || 'Unknown Customer'),
    '{{customerBlock}}': customerBlock,
    '{{quoteTitle}}': escapeHtml(quote.title || ''),
    '{{quoteDate}}': escapeHtml(formatDate(quote.createdAt)),
    '{{validUntil}}': escapeHtml(validUntil),
    '{{subtotal}}': escapeHtml(formatCurrency(quote.subtotal)),
    '{{tax}}': escapeHtml(formatCurrency(quote.taxAmount || 0)),
    '{{total}}': escapeHtml(formatCurrency(quote.total)),
    '{{lineItems}}': buildQuoteLineItemsHtml(quote),
    '{{preparedBy}}': escapeHtml(preparedBy),
    '{{preparedByEmail}}': escapeHtml(assignedUser?.email || ''),
  }));
};

export const buildInvoiceTemplateHtml = ({
  template,
  company,
  invoice,
  customer,
  contact,
}: {
  template: DocumentTemplates['invoice'];
  company: CompanySettings;
  invoice: Invoice;
  customer: Customer | null;
  contact: Contact | null;
}): string => {
  const effectiveTemplate = template || DEFAULT_DOCUMENT_TEMPLATES.invoice;
  const companyAddress = buildCompanyAddress(company);
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate) : 'Upon receipt';
  const contactName = contact ? `${contact.firstName} ${contact.lastName}`.trim() : '';

  const customerBlock = [
    customer?.name || invoice.customerName || '',
    contactName ? `Attn: ${contactName}${contact?.title ? `, ${contact.title}` : ''}` : '',
    customer?.address || '',
    `${[customer?.city, customer?.state].filter(Boolean).join(', ')}${customer?.zip ? ` ${customer.zip}` : ''}`.trim(),
    contact?.email || '',
    contact?.phone || '',
  ].filter(Boolean).map(escapeHtml).join('<br>');

  return ensureHtmlDocument(replaceTokens(effectiveTemplate, {
    '{{companyName}}': escapeHtml(company.name),
    '{{companyAddress}}': escapeHtml(companyAddress),
    '{{companyPhone}}': escapeHtml(company.phone),
    '{{companyEmail}}': escapeHtml(company.email),
    '{{invoiceNumber}}': escapeHtml(invoice.number),
    '{{customerName}}': escapeHtml(customer?.name || invoice.customerName || 'Unknown Customer'),
    '{{customerBlock}}': customerBlock,
    '{{invoiceDate}}': escapeHtml(formatDate(invoice.createdAt)),
    '{{dueDate}}': escapeHtml(dueDate),
    '{{subtotal}}': escapeHtml(formatCurrency(invoice.subtotal)),
    '{{tax}}': escapeHtml(formatCurrency(invoice.taxAmount || 0)),
    '{{total}}': escapeHtml(formatCurrency(invoice.total)),
    '{{lineItems}}': buildInvoiceLineItemsHtml(invoice),
  }));
};

export const buildPurchaseOrderTemplateHtml = ({
  template,
  company,
  purchaseOrder,
  vendor,
}: {
  template: DocumentTemplates['purchaseOrder'];
  company: CompanySettings;
  purchaseOrder: PurchaseOrder;
  vendor: Vendor | null;
}): string => {
  const effectiveTemplate = template || DEFAULT_DOCUMENT_TEMPLATES.purchaseOrder;
  const companyAddress = buildCompanyAddress(company);
  const vendorAddress = [
    vendor?.address || '',
    `${[vendor?.city, vendor?.state].filter(Boolean).join(', ')}${vendor?.zip ? ` ${vendor.zip}` : ''}`.trim(),
  ].filter(Boolean).map(escapeHtml).join('<br>');

  return ensureHtmlDocument(replaceTokens(effectiveTemplate, {
    '{{companyName}}': escapeHtml(company.name),
    '{{companyAddress}}': escapeHtml(companyAddress),
    '{{companyPhone}}': escapeHtml(company.phone),
    '{{companyEmail}}': escapeHtml(company.email),
    '{{purchaseOrderNumber}}': escapeHtml(purchaseOrder.number),
    '{{purchaseOrderDate}}': escapeHtml(formatDate(purchaseOrder.createdAt)),
    '{{expectedDate}}': escapeHtml(purchaseOrder.expectedDate ? formatDate(purchaseOrder.expectedDate) : 'TBD'),
    '{{purchaseOrderStatus}}': escapeHtml(purchaseOrder.status),
    '{{purchaseOrderNotes}}': escapeHtml(purchaseOrder.notes || ''),
    '{{vendorName}}': escapeHtml(vendor?.name || 'Unknown Vendor'),
    '{{vendorAddress}}': vendorAddress,
    '{{vendorPhone}}': escapeHtml(vendor?.phone || ''),
    '{{vendorEmail}}': escapeHtml(vendor?.email || ''),
    '{{subtotal}}': escapeHtml(formatCurrency(purchaseOrder.subtotal)),
    '{{tax}}': escapeHtml(formatCurrency(purchaseOrder.tax || 0)),
    '{{total}}': escapeHtml(formatCurrency(purchaseOrder.total)),
    '{{lineItems}}': buildPurchaseOrderLineItemsHtml(purchaseOrder),
  }));
};

export const buildWorkOrderTemplateHtml = ({
  template,
  company,
  order,
  customer,
  contact,
  csr,
  salesRep,
  qrCodeUrl,
  itemQrCodeUrls = {},
}: {
  template: DocumentTemplates['workOrder'];
  company: CompanySettings;
  order: Order;
  customer: Customer | null;
  contact: Contact | null;
  csr: User | null;
  salesRep: User | null;
  qrCodeUrl: string;
  itemQrCodeUrls?: Record<string, string>;
}): string => {
  const effectiveTemplate = ensureWorkOrderQrMarkup(template || DEFAULT_DOCUMENT_TEMPLATES.workOrder);
  const companyAddress = buildCompanyAddress(company);
  const contactName = contact ? `${contact.firstName} ${contact.lastName}`.trim() : '';

  return ensureHtmlDocument(replaceTokens(effectiveTemplate, {
    '{{companyName}}': escapeHtml(company.name),
    '{{companyAddress}}': escapeHtml(companyAddress),
    '{{companyPhone}}': escapeHtml(company.phone),
    '{{companyEmail}}': escapeHtml(company.email),
    '{{orderNumber}}': escapeHtml(order.number),
    '{{orderDate}}': escapeHtml(formatDate(order.createdAt)),
    '{{dueDate}}': escapeHtml(order.dueDate ? formatDate(order.dueDate) : 'TBD'),
    '{{customerName}}': escapeHtml(customer?.name || order.customerName || 'Unknown Customer'),
    '{{contactName}}': escapeHtml(contactName || order.contactName || ''),
    '{{csrName}}': escapeHtml(csr?.name || ''),
    '{{salesName}}': escapeHtml(salesRep?.name || ''),
    '{{orderTitle}}': escapeHtml(order.title || ''),
    '{{orderDescription}}': escapeHtml(order.description || ''),
    '{{internalNotes}}': escapeHtml(order.internalNotes || order.notes || ''),
    '{{workOrderItems}}': buildWorkOrderItemsHtml(order, itemQrCodeUrls),
    '{{qrCodeUrl}}': escapeHtml(qrCodeUrl),
  }));
};
