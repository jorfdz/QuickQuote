import React, { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, Table, Modal, Input, Select } from '../../components/ui';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';
import type { ProductFamily } from '../../types';

export const Materials: React.FC = () => {
  const { materials, vendors, updateMaterial, addMaterial } = useStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', unit: 'sqft' as any, costPerUnit: 0, markup: 45, width: undefined as number | undefined, vendorId: '', notes: '' });

  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category)))];
  const filtered = materials.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = () => {
    addMaterial({ id: nanoid(), ...form, productFamily: [], isFavorite: false, createdAt: new Date().toISOString() });
    setShowNew(false);
  };

  return (
    <div>
      <PageHeader title="Materials" subtitle={`${materials.length} materials in catalog`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>Add Material</Button>}
      />
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search materials..." />
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {categories.map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${categoryFilter === c ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{c}</button>)}
          </div>
        </div>
      </Card>
      <Card>
        <Table headers={['', 'Name', 'Category', 'Unit', 'Width', 'Cost/Unit', 'Markup', 'Sell Price', 'Vendor', '']}>
          {filtered.map(m => (
            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-2 pl-4">
                <button onClick={() => updateMaterial(m.id, { isFavorite: !m.isFavorite })}>
                  <Star className={`w-4 h-4 ${m.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              </td>
              <td className="py-3 px-4 font-medium text-sm text-gray-900">{m.name}{m.sku && <span className="text-xs text-gray-400 ml-1">#{m.sku}</span>}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.category}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.unit}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.width ? `${m.width}"` : '—'}</td>
              <td className="py-3 px-4 text-sm text-gray-700 font-medium">{formatCurrency(m.costPerUnit)}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{m.markup || 0}%</td>
              <td className="py-3 px-4 text-sm font-bold text-blue-700">{formatCurrency(m.costPerUnit * (1 + (m.markup || 0) / 100))}</td>
              <td className="py-3 px-4 text-sm text-gray-400">{vendors.find(v => v.id === m.vendorId)?.name || '—'}</td>
              <td className="py-3 px-4"><Button size="sm" variant="ghost" onClick={() => {}}>Edit</Button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Material">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Material Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 100lb Gloss Cover" />
            <Input label="SKU / Item #" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Paper, Vinyl, Substrate" />
            <Select label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as any }))}
              options={['sqft', 'sqin', 'sheet', 'each', 'linear_ft', 'roll', 'lb'].map(u => ({ value: u, label: u }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cost Per Unit ($)" type="number" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: parseFloat(e.target.value) || 0 }))} prefix="$" />
            <Input label="Default Markup %" type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: parseFloat(e.target.value) || 0 }))} suffix="%" />
            <Input label="Width (inches)" type="number" value={form.width || ''} onChange={e => setForm(f => ({ ...f, width: parseFloat(e.target.value) || undefined }))} placeholder="e.g. 54" />
          </div>
          <Select label="Vendor" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
            options={[{ value: '', label: 'No vendor' }, ...vendors.map(v => ({ value: v.id, label: v.name }))]} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!form.name || !form.category}>Add Material</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
