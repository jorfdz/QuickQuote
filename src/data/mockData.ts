import type { 
  User, Customer, Contact, Material, Equipment, Vendor, 
  Quote, Order, Invoice, Workflow, ProductTemplate, PurchaseOrder
} from '../types';
import orderTrackerBoards from './orderTrackerBoards.json';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  { id: 'u1', name: 'John Mitchell', email: 'john@printco.com', role: 'admin', active: true, createdAt: '2024-01-01' },
  { id: 'u2', name: 'Denise Rivera', email: 'denise@printco.com', role: 'csr', active: true, createdAt: '2024-01-05' },
  { id: 'u3', name: 'Amanda Chen', email: 'amanda@printco.com', role: 'estimator', active: true, createdAt: '2024-01-10' },
  { id: 'u4', name: 'Mike Torres', email: 'mike@printco.com', role: 'production', active: true, createdAt: '2024-02-01' },
  { id: 'u5', name: 'Salo Levy', email: 'salo@printco.com', role: 'sales', active: true, createdAt: '2024-02-15' },
];

export const currentUser = mockUsers[0];

// ─── MATERIALS ───────────────────────────────────────────────────────────────

export const mockMaterials: Material[] = [
  { id: 'm1', name: '100lb Gloss Cover', category: 'Paper', productFamily: ['digital_print', 'offset_print'], unit: 'sheet', costPerUnit: 0.08, markup: 40, isFavorite: true, createdAt: '2024-01-01' },
  { id: 'm2', name: '60lb Uncoated Text', category: 'Paper', productFamily: ['digital_print', 'offset_print'], unit: 'sheet', costPerUnit: 0.04, markup: 40, isFavorite: true, createdAt: '2024-01-01' },
  { id: 'm3', name: '3M IJ180 White Vinyl', category: 'Vinyl', productFamily: ['wide_format', 'roll_sign'], unit: 'sqft', width: 54, costPerUnit: 0.65, markup: 50, isFavorite: true, vendorId: 'v1', createdAt: '2024-01-01' },
  { id: 'm4', name: '10mil Gloss Laminate', category: 'Laminate', productFamily: ['wide_format', 'rigid_sign'], unit: 'sqft', width: 54, costPerUnit: 0.35, markup: 45, isFavorite: false, createdAt: '2024-01-01' },
  { id: 'm5', name: '4mm White Coroplast', category: 'Rigid Substrate', productFamily: ['rigid_sign'], unit: 'sqft', costPerUnit: 0.55, markup: 60, isFavorite: true, createdAt: '2024-01-01' },
  { id: 'm6', name: '1/8" Aluminum Dibond', category: 'Rigid Substrate', productFamily: ['rigid_sign'], unit: 'sqft', costPerUnit: 2.80, markup: 40, isFavorite: false, createdAt: '2024-01-01' },
  { id: 'm7', name: 'Gildan 5000 T-Shirt', category: 'Apparel Blank', productFamily: ['apparel'], unit: 'each', costPerUnit: 4.50, markup: 80, isFavorite: true, vendorId: 'v2', createdAt: '2024-01-01' },
  { id: 'm8', name: '13oz Scrim Banner', category: 'Banner', productFamily: ['wide_format', 'roll_sign'], unit: 'sqft', width: 60, costPerUnit: 0.45, markup: 50, isFavorite: true, createdAt: '2024-01-01' },
  { id: 'm9', name: '1/2" White Foam Board', category: 'Rigid Substrate', productFamily: ['rigid_sign'], unit: 'sqft', costPerUnit: 1.20, markup: 55, isFavorite: true, createdAt: '2024-01-01' },
  { id: 'm10', name: 'Clear Vinyl - Window Perf', category: 'Vinyl', productFamily: ['wide_format'], unit: 'sqft', width: 54, costPerUnit: 1.10, markup: 60, isFavorite: false, createdAt: '2024-01-01' },
  { id: 'm11', name: '80lb Gloss Text', category: 'Paper', productFamily: ['digital_print', 'offset_print'], unit: 'sheet', costPerUnit: 0.06, markup: 40, isFavorite: false, createdAt: '2024-01-01' },
  { id: 'm12', name: '14pt C2S Card Stock', category: 'Paper', productFamily: ['digital_print'], unit: 'sheet', costPerUnit: 0.09, markup: 40, isFavorite: true, createdAt: '2024-01-01' },
];

// ─── EQUIPMENT ───────────────────────────────────────────────────────────────

export const mockEquipment: Equipment[] = [
  { id: 'e1', name: 'HP Indigo 7K', model: 'Indigo 7K', manufacturer: 'HP', type: 'digital_press', speed: 2700, speedUnit: 'sheets_hr', costPerHour: 125, setupCost: 25, active: true, createdAt: '2024-01-01' },
  { id: 'e2', name: 'HP Latex 800W', model: 'Latex 800W', manufacturer: 'HP', type: 'wide_format_printer', width: 64, speed: 215, speedUnit: 'sqft_hr', costPerHour: 45, setupCost: 15, active: true, createdAt: '2024-01-01' },
  { id: 'e3', name: 'Roland VG3-540', model: 'VG3-540', manufacturer: 'Roland', type: 'wide_format_printer', width: 54, speed: 180, speedUnit: 'sqft_hr', costPerHour: 38, setupCost: 12, active: true, createdAt: '2024-01-01' },
  { id: 'e4', name: 'Graphtec FC9000', model: 'FC9000-160', manufacturer: 'Graphtec', type: 'cutter', width: 64, speed: 100, speedUnit: 'linear_ft_hr', costPerHour: 18, setupCost: 5, active: true, createdAt: '2024-01-01' },
  { id: 'e5', name: 'GBC Laminator', model: 'Catena 65', manufacturer: 'GBC', type: 'laminator', width: 65, speed: 150, speedUnit: 'sqft_hr', costPerHour: 12, setupCost: 8, active: true, createdAt: '2024-01-01' },
  { id: 'e6', name: 'Ryobi 3302M Offset', model: '3302M', manufacturer: 'Ryobi', type: 'offset_press', speed: 8000, speedUnit: 'sheets_hr', costPerHour: 185, setupCost: 75, active: true, createdAt: '2024-01-01' },
];

// ─── VENDORS ─────────────────────────────────────────────────────────────────

export const mockVendors: Vendor[] = [
  { id: 'v1', name: 'Grimco Inc', email: 'orders@grimco.com', phone: '800-542-9941', website: 'grimco.com', isOutsourcedProduction: false, paymentTerms: 'Net 30', createdAt: '2024-01-01' },
  { id: 'v2', name: 'S&S Activewear', email: 'wholesale@ssactivewear.com', phone: '800-523-2155', website: 'ssactivewear.com', isOutsourcedProduction: false, paymentTerms: 'Net 30', createdAt: '2024-01-01' },
  { id: 'v3', name: 'Trade Signs USA', email: 'orders@tradesigns.com', phone: '866-763-8588', isOutsourcedProduction: true, paymentTerms: 'Net 15', createdAt: '2024-01-01' },
  { id: 'v4', name: 'Minuteman Press', email: 'wholesale@minuteman.com', phone: '800-645-3006', isOutsourcedProduction: true, paymentTerms: 'Prepaid', createdAt: '2024-01-01' },
  { id: 'v5', name: 'Mac Papers', email: 'orders@macpapers.com', phone: '800-622-7267', isOutsourcedProduction: false, paymentTerms: 'Net 30', createdAt: '2024-01-01' },
];

// ─── WORKFLOWS ───────────────────────────────────────────────────────────────

export const mockWorkflows: Workflow[] = orderTrackerBoards as Workflow[];

// ─── PRODUCT TEMPLATES ────────────────────────────────────────────────────────

export const mockTemplates: ProductTemplate[] = [
  { id: 't1', name: 'Business Cards', productFamily: 'digital_print', icon: '🃏', description: 'Standard 3.5" x 2" business cards, full color both sides', isFavorite: true, usageCount: 142, defaultLineItem: { productFamily: 'digital_print', description: 'Business Cards - Full Color 2/2', width: 3.5, height: 2, unit: 'each', quantity: 500, markup: 45, materialId: 'm12', materialName: '14pt C2S Card Stock' }, createdAt: '2024-01-01' },
  { id: 't2', name: 'Postcards 4x6', productFamily: 'digital_print', icon: '📮', description: '4x6 full color postcard, 100lb gloss cover', isFavorite: true, usageCount: 98, defaultLineItem: { productFamily: 'digital_print', description: 'Postcards 4x6 - Full Color', width: 6, height: 4, unit: 'each', quantity: 500, markup: 45 }, createdAt: '2024-01-01' },
  { id: 't3', name: 'Postcards 5x8', productFamily: 'digital_print', icon: '📮', description: '5x8 full color postcard, 100lb gloss cover', isFavorite: true, usageCount: 76, defaultLineItem: { productFamily: 'digital_print', description: 'Postcards 5x8 - Full Color', width: 8, height: 5, unit: 'each', quantity: 500, markup: 45 }, createdAt: '2024-01-01' },
  { id: 't4', name: 'Yard Signs', productFamily: 'rigid_sign', icon: '🪧', description: '18x24 Coroplast yard sign, double-sided', isFavorite: true, usageCount: 76, defaultLineItem: { productFamily: 'rigid_sign', description: 'Yard Signs 18x24 - Coroplast', width: 24, height: 18, unit: 'each', quantity: 10, markup: 60, materialId: 'm5', materialName: '4mm White Coroplast' }, createdAt: '2024-01-01' },
  { id: 't5', name: 'Vinyl Banner', productFamily: 'wide_format', icon: '🎌', description: 'Standard 3x6 vinyl banner with hemming and grommets', isFavorite: true, usageCount: 88, defaultLineItem: { productFamily: 'wide_format', description: 'Vinyl Banner 3x6 - 13oz Scrim', width: 72, height: 36, unit: 'each', quantity: 1, markup: 55, materialId: 'm8', materialName: '13oz Scrim Banner' }, createdAt: '2024-01-01' },
  { id: 't6', name: 'Flyers 8.5x11', productFamily: 'digital_print', icon: '📄', description: 'Letter size single or double-sided flyers', isFavorite: false, usageCount: 112, defaultLineItem: { productFamily: 'digital_print', description: 'Flyers 8.5x11 - Full Color', width: 8.5, height: 11, unit: 'each', quantity: 250, markup: 40 }, createdAt: '2024-01-01' },
  { id: 't7', name: 'Step & Repeat', productFamily: 'wide_format', icon: '🏆', description: '8x8 step & repeat backdrop, standard event size', isFavorite: true, usageCount: 43, defaultLineItem: { productFamily: 'wide_format', description: 'Step & Repeat Backdrop 8x8', width: 96, height: 96, unit: 'each', quantity: 1, markup: 60, materialId: 'm8', materialName: '13oz Scrim Banner' }, createdAt: '2024-01-01' },
  { id: 't8', name: 'Foam Board Sign', productFamily: 'rigid_sign', icon: '🪟', description: '1/2" foam board sign, various sizes', isFavorite: false, usageCount: 31, defaultLineItem: { productFamily: 'rigid_sign', description: 'Foam Board Sign - 1/2"', width: 24, height: 36, unit: 'each', quantity: 1, markup: 55, materialId: 'm9', materialName: '1/2" White Foam Board' }, createdAt: '2024-01-01' },
  { id: 't9', name: 'T-Shirt Screen Print', productFamily: 'apparel', icon: '👕', description: '1-color screen print on Gildan tee', isFavorite: true, usageCount: 55, defaultLineItem: { productFamily: 'apparel', description: 'T-Shirts - 1 Color Screen Print', unit: 'each', quantity: 24, markup: 80, materialId: 'm7', materialName: 'Gildan 5000 T-Shirt' }, createdAt: '2024-01-01' },
  { id: 't10', name: 'Window Decal', productFamily: 'wide_format', icon: '🔲', description: 'Clear or white vinyl window decal', isFavorite: false, usageCount: 28, defaultLineItem: { productFamily: 'wide_format', description: 'Window Decal - Clear Vinyl', unit: 'sqft', quantity: 2, markup: 65, materialId: 'm3', materialName: '3M IJ180 White Vinyl' }, createdAt: '2024-01-01' },
  { id: 't11', name: 'Brochure Trifold', productFamily: 'digital_print', icon: '📑', description: '8.5x11 trifold brochure full color', isFavorite: true, usageCount: 67, defaultLineItem: { productFamily: 'digital_print', description: 'Trifold Brochure 8.5x11 - Full Color', width: 8.5, height: 11, unit: 'each', quantity: 250, markup: 42 }, createdAt: '2024-01-01' },
  { id: 't12', name: 'Vehicle Wrap', productFamily: 'wide_format', icon: '🚗', description: 'Partial or full vehicle wrap - vinyl', isFavorite: false, usageCount: 19, defaultLineItem: { productFamily: 'wide_format', description: 'Vehicle Wrap - Cast Vinyl', unit: 'sqft', quantity: 80, markup: 65, materialId: 'm3', materialName: '3M IJ180 White Vinyl' }, createdAt: '2024-01-01' },
];

// ─── QUOTES ──────────────────────────────────────────────────────────────────
// (Will be populated from realData.ts + user created)

export const mockQuotes: Quote[] = [
  {
    id: 'q1', number: 'Q000001', status: 'hot',
    customerId: 'rc3', customerName: 'Pixels on Target LLC',
    title: 'Annual Marketing Package - Q1 2026',
    lineItems: [
      { id: 'li1', productFamily: 'digital_print', description: 'Business Cards - Full Color 2/2', quantity: 1000, unit: 'each', width: 3.5, height: 2, materialId: 'm12', materialName: '14pt C2S Card Stock', materialCost: 90, equipmentId: 'e1', equipmentName: 'HP Indigo 7K', equipmentCost: 25, laborHours: 0.5, laborRate: 45, laborCost: 22.5, setupCost: 25, totalCost: 162.5, markup: 45, sellPrice: 235.63 },
      { id: 'li2', productFamily: 'digital_print', description: 'Postcards 5x8 - Full Color', quantity: 2500, unit: 'each', width: 8, height: 5, materialId: 'm1', materialName: '100lb Gloss Cover', materialCost: 200, equipmentId: 'e1', equipmentName: 'HP Indigo 7K', equipmentCost: 55, laborHours: 1, laborRate: 45, laborCost: 45, setupCost: 25, totalCost: 325, markup: 45, sellPrice: 471.25 },
      { id: 'li3', productFamily: 'wide_format', description: 'Step & Repeat Backdrop 8x8', quantity: 1, unit: 'each', width: 96, height: 96, materialId: 'm8', materialName: '13oz Scrim Banner', materialCost: 144, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 65, laborHours: 2, laborRate: 45, laborCost: 90, totalCost: 299, markup: 60, sellPrice: 478.40 },
    ],
    subtotal: 1185.28, taxRate: 7, taxAmount: 82.97, total: 1268.25,
    csrId: 'u2', salesId: 'u5',
    validUntil: '2026-04-30',
    createdAt: '2026-03-20', updatedAt: '2026-03-25'
  },
  {
    id: 'q2', number: 'Q000002', status: 'pending',
    customerId: 'rc4', customerName: 'Strategic Solutions Network',
    title: 'Conference Signage Package',
    lineItems: [
      { id: 'li4', productFamily: 'wide_format', description: 'Vinyl Banners 4x8 with Grommets', quantity: 8, unit: 'each', width: 96, height: 48, materialId: 'm8', materialName: '13oz Scrim Banner', materialCost: 384, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 120, laborHours: 4, laborRate: 45, laborCost: 180, totalCost: 684, markup: 55, sellPrice: 1060.20 },
      { id: 'li5', productFamily: 'rigid_sign', description: 'Foam Board Signs 24x36', quantity: 12, unit: 'each', width: 24, height: 36, materialId: 'm9', materialName: '1/2" White Foam Board', materialCost: 360, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 85, laborHours: 3, laborRate: 45, laborCost: 135, totalCost: 580, markup: 55, sellPrice: 899 },
    ],
    subtotal: 1959.20, taxRate: 7, taxAmount: 137.14, total: 2096.34,
    csrId: 'u2',
    validUntil: '2026-04-15',
    createdAt: '2026-03-22', updatedAt: '2026-03-22'
  },
  {
    id: 'q3', number: 'Q000003', status: 'won',
    customerId: 'rc5', customerName: '4eon',
    title: 'Event Booth Package - Spring Expo',
    convertedToOrderId: 'o1',
    lineItems: [
      { id: 'li6', productFamily: 'wide_format', description: 'Booth Wrap - 3 Faces Full Color', quantity: 1, unit: 'sqft', materialId: 'm3', materialName: '3M IJ180 White Vinyl', materialCost: 340, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 120, laborHours: 5, laborRate: 55, laborCost: 275, totalCost: 735, markup: 55, sellPrice: 1139.25 },
    ],
    subtotal: 1139.25, taxRate: 0, taxAmount: 0, total: 1139.25,
    csrId: 'u2',
    createdAt: '2026-03-10', updatedAt: '2026-03-12'
  },
  {
    id: 'q4', number: 'Q000004', status: 'cold',
    customerId: 'rc6', customerName: 'Leon Marketing',
    title: 'Wayfinding Signage System',
    lineItems: [
      { id: 'li7', productFamily: 'rigid_sign', description: 'Aluminum Dibond Signs 24x18', quantity: 20, unit: 'each', width: 24, height: 18, materialId: 'm6', materialName: '1/8" Aluminum Dibond', materialCost: 1680, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 280, laborHours: 12, laborRate: 55, laborCost: 660, totalCost: 2620, markup: 50, sellPrice: 3930 },
    ],
    subtotal: 3930, taxRate: 7, taxAmount: 275.10, total: 4205.10,
    csrId: 'u2', salesId: 'u5',
    validUntil: '2026-04-01',
    createdAt: '2026-03-05', updatedAt: '2026-03-08'
  },
  {
    id: 'q5', number: 'Q000005', status: 'pending',
    customerId: 'rc7', customerName: 'MP Integrative Marketing',
    title: 'Staff Uniform T-Shirts + Promo',
    lineItems: [
      { id: 'li8', productFamily: 'apparel', description: 'T-Shirts - 2 Color Front Screen Print', quantity: 72, unit: 'each', materialId: 'm7', materialName: 'Gildan 5000 T-Shirt', materialCost: 324, laborHours: 3, laborRate: 45, laborCost: 135, setupCost: 70, totalCost: 529, markup: 80, sellPrice: 952.20 },
    ],
    subtotal: 952.20, taxRate: 7, taxAmount: 66.65, total: 1018.85,
    csrId: 'u2',
    createdAt: '2026-03-25', updatedAt: '2026-03-25'
  },
];

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const mockOrders: Order[] = [
  {
    id: 'o1', number: 'O000001', status: 'in_progress',
    quoteId: 'q3', quoteNumber: 'Q000003',
    customerId: 'rc5', customerName: '4eon',
    title: 'Event Booth Package - Spring Expo',
    lineItems: [
      { id: 'oli1', productFamily: 'wide_format', description: 'Booth Wrap - 3 Faces Full Color', quantity: 1, unit: 'sqft', materialId: 'm3', materialName: '3M IJ180 White Vinyl', materialCost: 340, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 120, laborHours: 5, laborRate: 55, laborCost: 275, totalCost: 735, markup: 55, sellPrice: 1139.25, workflowStageId: 's9', assignedUserId: 'u4' },
    ],
    subtotal: 1139.25, taxRate: 0, taxAmount: 0, total: 1139.25,
    dueDate: '2026-03-31',
    csrId: 'u2', workflowId: 'wf2', currentStageId: 's9',
    createdAt: '2026-03-12', updatedAt: '2026-03-25'
  },
  {
    id: 'o2', number: 'O000002', status: 'in_progress',
    customerId: 'rc3', customerName: 'Pixels on Target LLC',
    title: 'Trade Show Graphics Package',
    lineItems: [
      { id: 'oli2', productFamily: 'wide_format', description: 'Step & Repeat 8x8', quantity: 1, unit: 'each', width: 96, height: 96, materialId: 'm8', materialName: '13oz Scrim Banner', materialCost: 144, equipmentId: 'e2', equipmentName: 'HP Latex 800W', equipmentCost: 65, laborHours: 2, laborRate: 45, laborCost: 90, totalCost: 299, markup: 60, sellPrice: 478.40, workflowStageId: 's8', assignedUserId: 'u4' },
      { id: 'oli3', productFamily: 'wide_format', description: 'Table Runner 2x6', quantity: 3, unit: 'each', totalCost: 95, markup: 65, sellPrice: 156.75, workflowStageId: 's8' },
    ],
    subtotal: 635.15, taxRate: 7, taxAmount: 44.46, total: 679.61,
    dueDate: '2026-03-28',
    csrId: 'u2', salesId: 'u5', workflowId: 'wf2', currentStageId: 's8',
    createdAt: '2026-03-18', updatedAt: '2026-03-22'
  },
  {
    id: 'o3', number: 'O000003', status: 'completed',
    customerId: 'rc4', customerName: 'Strategic Solutions Network',
    title: 'Business Cards - Executive Team',
    lineItems: [
      { id: 'oli4', productFamily: 'digital_print', description: 'Business Cards 3.5x2 - Full Color 2/2', quantity: 500, unit: 'each', totalCost: 95, markup: 45, sellPrice: 137.75, workflowStageId: 's6' },
    ],
    subtotal: 137.75, taxRate: 7, taxAmount: 9.64, total: 147.39,
    csrId: 'u2', workflowId: 'wf1', currentStageId: 's6',
    invoiceId: 'I000001',
    createdAt: '2026-03-01', updatedAt: '2026-03-08'
  },
  {
    id: 'o4', number: 'O000004', status: 'on_hold',
    customerId: 'rc8', customerName: 'Worldwide Business Research Limited',
    title: 'Conference Backdrop - Art Hold',
    lineItems: [
      { id: 'oli5', productFamily: 'wide_format', description: 'Step & Repeat Backdrop 10x8', quantity: 1, unit: 'each', width: 120, height: 96, totalCost: 285, markup: 60, sellPrice: 456, workflowStageId: 's7' },
    ],
    subtotal: 456, taxRate: 7, taxAmount: 31.92, total: 487.92,
    dueDate: '2026-04-10',
    csrId: 'u2', workflowId: 'wf2', currentStageId: 's7',
    internalNotes: 'On hold — waiting for customer to approve final artwork. Sara confirmed ETA April 3.',
    createdAt: '2026-03-20', updatedAt: '2026-03-24'
  },
];

// ─── INVOICES ────────────────────────────────────────────────────────────────

export const mockInvoices: Invoice[] = [
  {
    id: 'inv1', number: 'I000001', status: 'paid',
    customerId: 'rc4', customerName: 'Strategic Solutions Network',
    orderIds: ['o3'],
    lineItems: [
      { id: 'il1', description: 'Business Cards 3.5x2 (O000003)', quantity: 500, unit: 'each', unitPrice: 0.28, total: 137.75, orderId: 'o3' },
    ],
    subtotal: 137.75, taxRate: 7, taxAmount: 9.64, total: 147.39,
    dueDate: '2026-03-15', paidDate: '2026-03-12', paidAmount: 147.39,
    createdAt: '2026-03-08', updatedAt: '2026-03-12'
  },
];

// ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1', number: 'PO000001', vendorId: 'v1', orderId: 'o1',
    status: 'received',
    items: [
      { id: 'poi1', description: '3M IJ180 White Vinyl - 54" x 25yd roll', quantity: 2, unit: 'roll', unitCost: 185, total: 370, receivedQuantity: 2 },
    ],
    subtotal: 370, total: 370,
    notes: 'Rush order for 4eon booth wrap',
    expectedDate: '2026-03-20', receivedDate: '2026-03-19',
    sentAt: '2026-03-13', acknowledgedAt: '2026-03-14',
    createdBy: 'u2',
    createdAt: '2026-03-13', updatedAt: '2026-03-19'
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function generateNumber(prefix: string, count: number): string {
  return `${prefix}${String(count).padStart(6, '0')}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}
