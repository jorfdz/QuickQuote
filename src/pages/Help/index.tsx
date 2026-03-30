import React, { useState } from 'react';
import { Search, Video, MessageCircle, BookOpen, Zap } from 'lucide-react';
import { Card, PageHeader } from '../../components/ui';

const DOCS = [
  { icon: '🚀', title: 'Getting Started', desc: 'Set up your account and create your first quote in under 10 minutes.', tag: 'Beginner' },
  { icon: '📋', title: 'Creating Quotes', desc: 'Learn the quote builder, AI quick quote, templates, and smart pricing.', tag: 'Core' },
  { icon: '📦', title: 'Managing Orders', desc: 'Convert quotes to orders, assign workflows, and track production.', tag: 'Core' },
  { icon: '📊', title: 'Order Tracker Board', desc: 'Use the Kanban board to visualize your production pipeline.', tag: 'Core' },
  { icon: '🧱', title: 'Materials Setup', desc: 'Add your material catalog with costs, vendors, and markup defaults.', tag: 'Setup' },
  { icon: '🔧', title: 'Equipment Setup', desc: 'Configure your presses with speed and cost assumptions.', tag: 'Setup' },
  { icon: '🧾', title: 'Invoicing', desc: 'Create invoices from orders, send to customers, track payment.', tag: 'Billing' },
  { icon: '🔮', title: 'PlanProphet Integration', desc: 'Connect QuikQuote to PlanProphet for full CRM and analytics sync.', tag: 'Integration' },
  { icon: '🎁', title: 'ASI Promo Products', desc: 'Search ASI catalog and import product data into quotes automatically.', tag: 'Integration' },
  { icon: '🔌', title: 'API & Webhooks', desc: 'Connect third-party systems using the QuikQuote REST API.', tag: 'Developer' },
];

export const Help: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = DOCS.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <PageHeader title="Help Center" subtitle="Documentation, guides, and support" />
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 mb-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">How can we help?</h2>
        <div className="relative max-w-md mx-auto mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search docs..." className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{ icon: <Zap className="w-5 h-5 text-yellow-500" />, label: 'Quick Start', color: 'bg-yellow-50' }, { icon: <Video className="w-5 h-5 text-blue-500" />, label: 'Videos', color: 'bg-blue-50' }, { icon: <MessageCircle className="w-5 h-5 text-emerald-500" />, label: 'Live Chat', color: 'bg-emerald-50' }, { icon: <BookOpen className="w-5 h-5 text-violet-500" />, label: 'Full Docs', color: 'bg-violet-50' }].map(l => (
          <button key={l.label} className={`card p-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${l.color} hover:shadow-md`}>{l.icon}<span className="text-xs font-semibold text-gray-700">{l.label}</span></button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(doc => (
          <Card key={doc.title} className="p-5 cursor-pointer hover:shadow-md transition-all hover:border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{doc.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-gray-900 text-sm">{doc.title}</h3><span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{doc.tag}</span></div>
                <p className="text-xs text-gray-500">{doc.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
