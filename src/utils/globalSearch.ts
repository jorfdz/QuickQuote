import type {
  Contact,
  Customer,
  Invoice,
  Order,
  PurchaseOrder,
  Quote,
  User,
  Vendor,
} from '../types';
import type {
  PricingBrokered,
  PricingCategory,
  PricingEquipment,
  PricingFinishing,
  PricingLabor,
  PricingMaterial,
  PricingProduct,
  ProductPricingTemplate,
} from '../types/pricing';

export type GlobalSearchEntity =
  | 'customers'
  | 'contacts'
  | 'estimates'
  | 'orders'
  | 'invoices'
  | 'purchaseOrders'
  | 'vendors'
  | 'users'
  | 'materials'
  | 'products'
  | 'pricingTemplates'
  | 'equipment'
  | 'finishing'
  | 'labor'
  | 'brokered';

export interface GlobalSearchItem {
  id: string;
  entity: GlobalSearchEntity;
  entityLabel: string;
  title: string;
  subtitle: string;
  href: string;
  searchText: string;
  badge?: string;
}

interface BuildGlobalSearchIndexInput {
  customers: Customer[];
  contacts: Contact[];
  quotes: Quote[];
  orders: Order[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  users: User[];
  materials: PricingMaterial[];
  products: PricingProduct[];
  pricingTemplates: ProductPricingTemplate[];
  equipment: PricingEquipment[];
  finishing: PricingFinishing[];
  labor: PricingLabor[];
  brokered: PricingBrokered[];
  categories: PricingCategory[];
}

export const normalizeSearchValue = (value: string) =>
  value.toLowerCase().replace(/\s+/g, ' ').trim();

const makeSearchText = (...values: Array<string | number | null | undefined>) =>
  normalizeSearchValue(values.filter(Boolean).join(' '));

const buildQueryHref = (pathname: string, query: string) =>
  `${pathname}?search=${encodeURIComponent(query)}`;

export const buildGlobalSearchIndex = ({
  customers,
  contacts,
  quotes,
  orders,
  invoices,
  purchaseOrders,
  vendors,
  users,
  materials,
  products,
  pricingTemplates,
  equipment,
  finishing,
  labor,
  brokered,
  categories,
}: BuildGlobalSearchIndexInput): GlobalSearchItem[] => {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));

  return [
    ...customers.map((customer) => ({
      id: customer.id,
      entity: 'customers' as const,
      entityLabel: 'Customers',
      title: customer.name,
      subtitle: [customer.email, customer.phone, [customer.city, customer.state].filter(Boolean).join(', ')].filter(Boolean).join(' • ') || 'Customer',
      href: `/customers/${customer.id}`,
      searchText: makeSearchText(
        customer.name,
        customer.company,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.state,
        customer.zip,
        customer.website,
        customer.tags?.join(' '),
      ),
    })),
    ...contacts.map((contact) => {
      const fullName = `${contact.firstName} ${contact.lastName}`.trim();
      const companyName = customerNameById.get(contact.customerId) || 'Contact';
      return {
        id: contact.id,
        entity: 'contacts' as const,
        entityLabel: 'Contacts',
        title: fullName,
        subtitle: [companyName, contact.title, contact.email || contact.phone || contact.mobile].filter(Boolean).join(' • '),
        href: buildQueryHref('/contacts', fullName || companyName),
        searchText: makeSearchText(
          fullName,
          companyName,
          contact.title,
          contact.email,
          contact.phone,
          contact.mobile,
          contact.notes,
        ),
      };
    }),
    ...quotes.map((quote) => ({
      id: quote.id,
      entity: 'estimates' as const,
      entityLabel: 'Estimates',
      title: `${quote.number} • ${quote.title}`,
      subtitle: [quote.customerName, quote.contactName, quote.status].filter(Boolean).join(' • '),
      href: `/quotes/${quote.id}`,
      searchText: makeSearchText(
        quote.number,
        quote.title,
        quote.customerName,
        quote.contactName,
        quote.status,
        quote.description,
        quote.notes,
        quote.internalNotes,
        quote.lineItems.map((item) => item.description).join(' '),
      ),
      badge: quote.status,
    })),
    ...orders.map((order) => ({
      id: order.id,
      entity: 'orders' as const,
      entityLabel: 'Orders',
      title: `${order.number} • ${order.title}`,
      subtitle: [order.customerName, order.quoteNumber, order.status].filter(Boolean).join(' • '),
      href: `/orders/${order.id}`,
      searchText: makeSearchText(
        order.number,
        order.title,
        order.customerName,
        order.contactName,
        order.quoteNumber,
        order.status,
        order.description,
        order.notes,
        order.internalNotes,
        order.lineItems.map((item) => item.description).join(' '),
      ),
      badge: order.status,
    })),
    ...invoices.map((invoice) => ({
      id: invoice.id,
      entity: 'invoices' as const,
      entityLabel: 'Invoices',
      title: `${invoice.number} • ${invoice.customerName}`,
      subtitle: [invoice.status, invoice.orderIds.join(', ')].filter(Boolean).join(' • '),
      href: `/invoices/${invoice.id}`,
      searchText: makeSearchText(
        invoice.number,
        invoice.customerName,
        invoice.status,
        invoice.notes,
        invoice.orderIds.join(' '),
        invoice.lineItems.map((item) => item.description).join(' '),
      ),
      badge: invoice.status,
    })),
    ...purchaseOrders.map((purchaseOrder) => {
      const vendorName = vendors.find((vendor) => vendor.id === purchaseOrder.vendorId)?.name || 'Vendor';
      return {
        id: purchaseOrder.id,
        entity: 'purchaseOrders' as const,
        entityLabel: 'POs',
        title: `${purchaseOrder.number} • ${vendorName}`,
        subtitle: [purchaseOrder.status, purchaseOrder.orderId].filter(Boolean).join(' • '),
        href: `/purchase-orders/${purchaseOrder.id}`,
        searchText: makeSearchText(
          purchaseOrder.number,
          vendorName,
          purchaseOrder.status,
          purchaseOrder.notes,
          purchaseOrder.orderId,
          purchaseOrder.items.map((item) => item.description).join(' '),
        ),
        badge: purchaseOrder.status,
      };
    }),
    ...vendors.map((vendor) => ({
      id: vendor.id,
      entity: 'vendors' as const,
      entityLabel: 'Vendors',
      title: vendor.name,
      subtitle: [vendor.email, vendor.phone, vendor.paymentTerms].filter(Boolean).join(' • ') || 'Vendor',
      href: buildQueryHref('/vendors', vendor.name),
      searchText: makeSearchText(
        vendor.name,
        vendor.email,
        vendor.phone,
        vendor.website,
        vendor.address,
        vendor.city,
        vendor.state,
        vendor.zip,
        vendor.accountNumber,
        vendor.paymentTerms,
        vendor.notes,
      ),
    })),
    ...users.map((user) => ({
      id: user.id,
      entity: 'users' as const,
      entityLabel: 'Users',
      title: user.name,
      subtitle: [user.email, user.role, user.active ? 'Active' : 'Inactive'].filter(Boolean).join(' • '),
      href: buildQueryHref('/users', user.name),
      searchText: makeSearchText(user.name, user.email, user.role, user.active ? 'active' : 'inactive'),
    })),
    ...materials.map((material) => ({
      id: material.id,
      entity: 'materials' as const,
      entityLabel: 'Materials',
      title: material.name,
      subtitle: [material.size, material.vendorName, material.vendorMaterialId].filter(Boolean).join(' • ') || 'Material',
      href: buildQueryHref('/materials', material.name),
      searchText: makeSearchText(
        material.name,
        material.size,
        material.description,
        material.vendorName,
        material.vendorId,
        material.vendorMaterialId,
        material.vendorContactName,
        material.vendorSalesRep,
      ),
    })),
    ...products.map((product) => {
      const productCategories = product.categoryIds
        .map((categoryId) => categoryNameById.get(categoryId))
        .filter(Boolean)
        .join(', ');
      return {
        id: product.id,
        entity: 'products' as const,
        entityLabel: 'Products',
        title: product.name,
        subtitle: [productCategories, product.defaultMaterialName, product.defaultEquipmentName].filter(Boolean).join(' • ') || 'Product',
        href: buildQueryHref('/catalog', product.name),
        searchText: makeSearchText(
          product.name,
          product.aliases.join(' '),
          product.defaultMaterialName,
          product.defaultEquipmentName,
          product.defaultFinalSize,
          productCategories,
        ),
      };
    }),
    ...pricingTemplates.map((template) => ({
      id: template.id,
      entity: 'pricingTemplates' as const,
      entityLabel: 'Templates',
      title: template.name,
      subtitle: [template.productName, template.categoryName, `${template.quantity} qty`].filter(Boolean).join(' • '),
      href: buildQueryHref('/templates', template.name),
      searchText: makeSearchText(
        template.name,
        template.productName,
        template.categoryName,
        template.materialName,
        template.equipmentName,
      ),
    })),
    ...equipment.map((item) => ({
      id: item.id,
      entity: 'equipment' as const,
      entityLabel: 'Equipment',
      title: item.name,
      subtitle: [item.categoryApplies, item.costUnit, item.colorCapability].filter(Boolean).join(' • '),
      href: buildQueryHref('/equipment', item.name),
      searchText: makeSearchText(
        item.name,
        item.categoryApplies,
        item.colorCapability,
        item.costUnit,
        item.maintenanceHistory.map((record) => record.description).join(' '),
      ),
    })),
    ...finishing.map((item) => ({
      id: item.id,
      entity: 'finishing' as const,
      entityLabel: 'Finishing',
      title: item.name,
      subtitle: item.description || 'Finishing',
      href: buildQueryHref('/finishing', item.name),
      searchText: makeSearchText(item.name, item.description, item.notes),
    })),
    ...labor.map((item) => ({
      id: item.id,
      entity: 'labor' as const,
      entityLabel: 'Labor',
      title: item.name,
      subtitle: item.description || 'Labor service',
      href: buildQueryHref('/labor', item.name),
      searchText: makeSearchText(item.name, item.description, item.notes),
    })),
    ...brokered.map((item) => ({
      id: item.id,
      entity: 'brokered' as const,
      entityLabel: 'Brokered',
      title: item.name,
      subtitle: [item.vendorName, item.description].filter(Boolean).join(' • ') || 'Brokered service',
      href: buildQueryHref('/brokered', item.name),
      searchText: makeSearchText(item.name, item.vendorName, item.description, item.notes),
    })),
  ];
};

export const scoreGlobalSearchItem = (item: GlobalSearchItem, query: string) => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return 0;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.some((token) => !item.searchText.includes(token))) {
    return -1;
  }

  const normalizedTitle = normalizeSearchValue(item.title);
  const normalizedSubtitle = normalizeSearchValue(item.subtitle);
  let score = 0;

  if (normalizedTitle === normalizedQuery) score += 120;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 80;
  if (item.searchText.startsWith(normalizedQuery)) score += 50;
  if (normalizedSubtitle.includes(normalizedQuery)) score += 20;
  if (item.searchText.includes(normalizedQuery)) score += 30;
  score += Math.max(0, 20 - normalizedTitle.length / 10);

  return score;
};

export const groupGlobalSearchResults = (items: GlobalSearchItem[], query: string, limitPerGroup = 6) => {
  const grouped = new Map<string, Array<GlobalSearchItem & { score: number }>>();

  items.forEach((item) => {
    const score = scoreGlobalSearchItem(item, query);
    if (score < 0) return;
    const group = grouped.get(item.entityLabel) || [];
    group.push({ ...item, score });
    grouped.set(item.entityLabel, group);
  });

  return Array.from(grouped.entries())
    .map(([entityLabel, groupItems]) => ({
      entityLabel,
      items: groupItems
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, limitPerGroup),
    }))
    .sort((a, b) => {
      const aTop = a.items[0]?.score ?? 0;
      const bTop = b.items[0]?.score ?? 0;
      return bTop - aTop || a.entityLabel.localeCompare(b.entityLabel);
    });
};
