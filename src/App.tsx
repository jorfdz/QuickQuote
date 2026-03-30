import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { QuotesList } from './pages/Quotes/QuotesList';
import { QuoteBuilder } from './pages/Quotes/QuoteBuilder';
import { QuoteDetail } from './pages/Quotes/QuoteDetail';
import { QuotePrint } from './pages/Quotes/QuotePrint';
import { OrdersList } from './pages/Orders/OrdersList';
import { OrderDetail } from './pages/Orders/OrderDetail';
import { NewOrder } from './pages/Orders/NewOrder';
import { OrderTracker } from './pages/OrderTracker';
import { Invoices } from './pages/Invoices';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/Customers/CustomerDetail';
import { Contacts } from './pages/Contacts';
import { Vendors } from './pages/Vendors';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Materials } from './pages/Materials';
import { Equipment } from './pages/Equipment';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Integrations } from './pages/Integrations';
import { Help } from './pages/Help';
import { Templates } from './pages/Templates';
import { History } from './pages/History';
import { Imposition } from './pages/Imposition';
import { PricingTool } from './pages/PricingTool';
import { Onboarding } from './pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone views - no layout wrapper */}
        <Route path="/quotes/:id/print" element={<QuotePrint />} />
        <Route path="/onboarding" element={<Onboarding />} />

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
          <Route path="/history" element={<History />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/help" element={<Help />} />
          <Route path="/imposition" element={<Imposition />} />
          <Route path="/pricing" element={<PricingTool />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
