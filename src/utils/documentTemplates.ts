import { formatCurrency, formatDate } from '../data/mockData';
import { DEFAULT_DOCUMENT_TEMPLATES } from '../data/documentSettings';
import type { CompanySettings, Contact, Customer, DocumentTemplates, Invoice, PurchaseOrder, Quote, User, Vendor } from '../types';

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
