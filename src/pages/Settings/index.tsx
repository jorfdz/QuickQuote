import React, { useState } from 'react';
import { Building, CreditCard, Printer, Globe, Shield, Bell, Palette } from 'lucide-react';
import { Card, PageHeader, Button, Input, Textarea, Tabs, Select } from '../../components/ui';

const TABS = [
  { id: 'company', label: 'Company' }, { id: 'branding', label: 'Branding' },
  { id: 'defaults', label: 'Quote Defaults' }, { id: 'notifications', label: 'Notifications' },
  { id: 'billing', label: 'Billing' },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [company, setCompany] = useState({
    name: 'PrintCo Solutions', email: 'admin@printco.com', phone: '555-100-0000',
    address: '100 Print Ave', city: 'Miami', state: 'FL', zip: '33101',
    website: 'www.printco.com', tagline: 'Quality Print. Fast Delivery.',
    defaultTaxRate: 7, defaultMarkup: 45, defaultLaborRate: 45,
    quoteValidDays: 30, currency: 'USD', timezone: 'America/New_York',
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your QuikQuote account" />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'company' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building className="w-4 h-4 text-blue-500" /> Company Information</h2>
          <div className="space-y-4">
            <Input label="Company Name" value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} />
              <Input label="Phone" value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} />
            </div>
            <Input label="Address" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={company.city} onChange={e => setCompany(c => ({ ...c, city: e.target.value }))} />
              <Input label="State" value={company.state} onChange={e => setCompany(c => ({ ...c, state: e.target.value }))} />
              <Input label="ZIP" value={company.zip} onChange={e => setCompany(c => ({ ...c, zip: e.target.value }))} />
            </div>
            <Input label="Website" value={company.website} onChange={e => setCompany(c => ({ ...c, website: e.target.value }))} prefix={<Globe className="w-3.5 h-3.5" />} />
            <div className="flex gap-3 pt-2">
              <Button variant="primary">Save Changes</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'defaults' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4">Quote & Pricing Defaults</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Default Tax Rate (%)" type="number" value={company.defaultTaxRate} onChange={e => setCompany(c => ({ ...c, defaultTaxRate: parseFloat(e.target.value) }))} suffix="%" />
              <Input label="Default Markup (%)" type="number" value={company.defaultMarkup} onChange={e => setCompany(c => ({ ...c, defaultMarkup: parseFloat(e.target.value) }))} suffix="%" />
              <Input label="Default Labor Rate ($/hr)" type="number" value={company.defaultLaborRate} onChange={e => setCompany(c => ({ ...c, defaultLaborRate: parseFloat(e.target.value) }))} prefix="$" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quote Valid (days)" type="number" value={company.quoteValidDays} onChange={e => setCompany(c => ({ ...c, quoteValidDays: parseInt(e.target.value) }))} />
              <Select label="Currency" value={company.currency} onChange={e => setCompany(c => ({ ...c, currency: e.target.value }))} options={[{ value: 'USD', label: 'USD - US Dollar' }, { value: 'CAD', label: 'CAD - Canadian Dollar' }]} />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Shop Profile</h3>
              <p className="text-xs text-blue-600 mb-3">Tell QuikQuote what products you produce to personalize your experience.</p>
              <div className="grid grid-cols-3 gap-2">
                {['Digital Print', 'Wide Format', 'Offset Print', 'Signs & Displays', 'Apparel', 'Labels', 'Promo Products', 'Finishing', 'Installation'].map(p => (
                  <label key={p} className="flex items-center gap-2 text-xs text-blue-800 cursor-pointer">
                    <input type="checkbox" defaultChecked={['Digital Print', 'Wide Format', 'Signs & Displays'].includes(p)} className="rounded border-blue-300 text-blue-600" />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2"><Button variant="primary">Save Defaults</Button></div>
          </div>
        </Card>
      )}

      {activeTab === 'branding' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-blue-500" /> Branding & Documents</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Company Logo</label>
              <div className="w-32 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-300 transition-colors">
                <div className="text-center"><p className="text-2xl">🖼️</p><p className="text-xs text-gray-400 mt-1">Upload logo</p></div>
              </div>
            </div>
            <Input label="Primary Brand Color" type="color" defaultValue="#2563eb" className="w-20 h-10" />
            <Textarea label="Quote Footer Text" defaultValue="Thank you for your business! Payment due within 30 days." rows={2} />
            <Textarea label="Invoice Footer Text" defaultValue="Questions? Contact us at admin@printco.com" rows={2} />
            <div className="flex gap-3 pt-2"><Button variant="primary">Save Branding</Button></div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { label: 'New order created', checked: true }, { label: 'Order status changed', checked: true },
              { label: 'Quote about to expire', checked: true }, { label: 'Invoice overdue', checked: true },
              { label: 'PO received from vendor', checked: false }, { label: 'PlanProphet sync events', checked: true },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{n.label}</span>
                <button className={`w-9 h-5 rounded-full transition-colors relative ${n.checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${n.checked ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> Subscription & Billing</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-900">QuikQuote Pro</p>
                <p className="text-xs text-blue-600">$149/month · Up to 10 users</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Active</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Your next billing date is April 1, 2026.</p>
          <div className="flex gap-3 mt-4"><Button variant="secondary">Manage Subscription</Button><Button variant="ghost">View Invoices</Button></div>
        </Card>
      )}
    </div>
  );
};
