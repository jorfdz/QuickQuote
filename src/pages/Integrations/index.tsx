import React, { useState } from 'react';
import { Zap, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, PageHeader, Button, Modal, Input } from '../../components/ui';

const INTEGRATIONS = [
  { id: 'planprophet', name: 'PlanProphet', logo: '🔮', category: 'CRM & Analytics', description: 'Sync customers, contacts, quotes, and order data with PlanProphet CRM. Bi-directional real-time sync.', connected: false, features: ['Customer sync', 'Contact sync', 'Quote push', 'Order status updates', 'Invoice sync', 'Webhooks'], badge: 'Recommended' },
  { id: 'quickbooks', name: 'QuickBooks Online', logo: '📊', category: 'Accounting', description: 'Sync invoices and payments to QuickBooks Online. Export customers and revenue data.', connected: false, features: ['Invoice sync', 'Payment tracking', 'Customer export', 'Chart of accounts'] },
  { id: 'onprintshop', name: 'OnPrintShop', logo: '🛒', category: 'Web-to-Print', description: 'Import web orders directly into QuikQuote. Auto-create orders from online submissions.', connected: false, features: ['Order import', 'Customer sync', 'Product catalog sync'] },
  { id: 'presero', name: 'Presero', logo: '🌐', category: 'Web-to-Print', description: 'Connect your Presero storefront to automatically pull orders into QuikQuote.', connected: false, features: ['Order pull', 'Status push', 'Customer sync'] },
  { id: 'asi', name: 'ASI / Counselor', logo: '🎁', category: 'Promotional Products', description: 'Search ASI product database, import product info, images, and pricing into quotes.', connected: false, features: ['Product search', 'Cost import', 'Image import', 'Spec import'], badge: 'Popular' },
  { id: 'sage', name: 'SAGE Promo', logo: '📦', category: 'Promotional Products', description: 'Access SAGE promotional product catalog for fast promo item quoting.', connected: false, features: ['Product search', 'Cost lookup', 'Supplier info'] },
  { id: 'photover', name: 'Photover', logo: '📸', category: 'Print Marketplace', description: 'Connect to Photover marketplace to accept and track outsourced print orders.', connected: false, features: ['Order import', 'Status sync', 'Pricing lookup'] },
];

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  const handleConnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: true } : i));
    setConnectingId(null);
    setApiKey('');
  };

  const connecting = INTEGRATIONS.find(i => i.id === connectingId);

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect QuikQuote to your other tools" />

      {/* API key section */}
      <Card className="p-5 mb-6 bg-gradient-to-r from-gray-900 to-gray-800 border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" /> QuikQuote API</h3>
            <p className="text-sm text-gray-400 mt-1">Build custom integrations using the QuikQuote REST API</p>
            <code className="text-xs text-blue-300 mt-2 block font-mono">https://api.quikquote.io/v1</code>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-2">Your API Key</p>
            <code className="text-xs text-emerald-300 font-mono bg-black/30 px-3 py-1.5 rounded">qq_live_••••••••••••••••</code>
            <div className="flex gap-2 mt-2 justify-end">
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">View Key</Button>
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">Docs <ExternalLink className="w-3 h-3" /></Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {integrations.map(integration => (
          <Card key={integration.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl border border-gray-100">{integration.logo}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{integration.name}</h3>
                    {integration.badge && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">{integration.badge}</span>}
                  </div>
                  <p className="text-xs text-gray-400">{integration.category}</p>
                </div>
              </div>
              {integration.connected ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium"><Check className="w-3 h-3" />Connected</span>
              ) : (
                <Button size="sm" variant="primary" onClick={() => setConnectingId(integration.id)}>Connect</Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-3">{integration.description}</p>
            <div className="flex flex-wrap gap-1">
              {integration.features.map(f => <span key={f} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-100">{f}</span>)}
            </div>
          </Card>
        ))}
      </div>

      {/* Webhook events info */}
      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">Webhook Events</h3>
        <div className="grid grid-cols-3 gap-2">
          {['quote.created', 'quote.updated', 'quote.converted', 'order.created', 'order.status_changed', 'order.completed', 'invoice.created', 'invoice.paid', 'customer.created', 'po.created', 'po.received'].map(e => (
            <code key={e} className="text-xs font-mono bg-gray-50 text-gray-600 px-2 py-1.5 rounded border border-gray-100">{e}</code>
          ))}
        </div>
      </Card>

      <Modal isOpen={!!connectingId} onClose={() => setConnectingId(null)} title={`Connect ${connecting?.name}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{connecting?.description}</p>
          <Input label="API Key / Access Token" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your API key here..." />
          <p className="text-xs text-gray-400">You can find your API key in {connecting?.name}'s developer settings.</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setConnectingId(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleConnect(connectingId!)} disabled={!apiKey.trim()}>Connect</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
