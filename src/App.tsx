import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuotesList } from './pages/Quotes/QuotesList';
import { QuoteBuilder } from './pages/Quotes/QuoteBuilder';
import { QuoteDetail } from './pages/Quotes/QuoteDetail';
import { OrdersList } from './pages/Orders/OrdersList';
import { OrderDetail } from './pages/Orders/OrderDetail';
import { NewOrder } from './pages/Orders/NewOrder';
import { OrderTracker } from './pages/OrderTracker';
import { Invoices } from './pages/Invoices';
import { InvoiceDetail } from './pages/Invoices/InvoiceDetail';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/Customers/CustomerDetail';
import { Contacts } from './pages/Contacts';
import { ContactDetail } from './pages/Contacts/ContactDetail';
import { Vendors } from './pages/Vendors';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { NewPurchaseOrder } from './pages/PurchaseOrders/NewPurchaseOrder';
import { PurchaseOrderDetail } from './pages/PurchaseOrders/PurchaseOrderDetail';
import { Materials } from './pages/Materials';
import { Equipment } from './pages/Equipment';
import { Finishing } from './pages/Finishing';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Integrations } from './pages/Integrations';
import { Help } from './pages/Help';
import { Templates } from './pages/Templates';
import { History } from './pages/History';
import { Imposition } from './pages/Imposition';
import { Catalog } from './pages/Catalog';
import { Services } from './pages/Services';
import { Labor } from './pages/Labor';
import { Brokered } from './pages/Brokered';
import { Onboarding } from './pages/Onboarding';
import { ScannerPage } from './pages/Scanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone views - no layout wrapper */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/scan/:deviceCode" element={<ScannerPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quotes" element={<QuotesList />} />
          <Route path="/quotes/new" element={<QuoteBuilder />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/quotes/:id/edit" element={<QuoteBuilder />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/tracker" element={<OrderTracker />} />
          <Route path="/OrderTracker/:orderNumber" element={<OrderTracker />} />
          <Route path="/history" element={<History />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/purchase-orders/new" element={<NewPurchaseOrder />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/services" element={<Services />} />
          <Route path="/labor" element={<Labor />} />
          <Route path="/brokered" element={<Brokered />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/finishing" element={<Finishing />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/help" element={<Help />} />
          <Route path="/imposition" element={<Imposition />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
