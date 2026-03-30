import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X, Check, Search } from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import type { PricingMaterial } from '../../types/pricing';

const emptyForm = {
  name: '',
  size: '',
  sizeWidth: 0,
  sizeHeight: 0,
  pricePerM: 0,
  markup: 70,
};

export const Materials: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = usePricingStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Derive unique size groups for filtering
  const sizeGroups = Array.from(new Set(materials.map(m => m.size))).sort();
  const [sizeFilter, setSizeFilter] = useState('all');

  const filtered = materials.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.size.includes(search);
    const matchSize = sizeFilter === 'all' || m.size === sizeFilter;
    return matchSearch && matchSize;
  });

  const handleOpenNew = () => {
    setForm(emptyForm);
    setShowNew(true);
  };

  const handleAdd = () => {
    if (!form.name) return;
    const sizeStr = form.size || `${form.sizeWidth}x${form.sizeHeight}`;
    addMaterial({
      name: form.name,
      size: sizeStr,
      sizeWidth: form.sizeWidth,
      sizeHeight: form.sizeHeight,
      pricePerM: form.pricePerM,
      markup: form.markup,
    });
    setShowNew(false);
    setForm(emptyForm);
  };

  const handleStartEdit = (m: PricingMaterial) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      size: m.size,
      sizeWidth: m.sizeWidth,
      sizeHeight: m.sizeHeight,
      pricePerM: m.pricePerM,
      markup: m.markup,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const sizeStr = form.size || `${form.sizeWidth}x${form.sizeHeight}`;
    updateMaterial(editingId, {
      name: form.name,
      size: sizeStr,
      sizeWidth: form.sizeWidth,
      sizeHeight: form.sizeHeight,
      pricePerM: form.pricePerM,
      markup: form.markup,
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteMaterial(id);
    setDeleteConfirm(null);
  };

  const parseSizeInput = (val: string) => {
    // Auto-parse "13x19" into width/height
    const match = val.match(/^(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)$/);
    if (match) {
      setForm(f => ({
        ...f,
        size: val,
        sizeWidth: parseFloat(match[1]),
        sizeHeight: parseFloat(match[2]),
      }));
    } else {
      setForm(f => ({ ...f, size: val }));
    }
  };

  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;
  const costPerSheet = (m: PricingMaterial) => m.pricePerM / 1000;
  const sellPerSheet = (m: PricingMaterial) => costPerSheet(m) * (1 + m.markup / 100);

  return (
    <div>
      <PageHeader
        title="Materials"
        subtitle={`${materials.length} materials in catalog`}
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenNew}>
            Add Material
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials by name or size..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sizeFilter}
            onChange={e => setSizeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sizes</option>
            {sizeGroups.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">{filtered.length} results</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table headers={['Material Name', 'Sheet Size', 'Width', 'Height', 'Price/M', 'Cost/Sheet', 'Markup %', 'Sell/Sheet', 'Actions']}>
          {filtered.map(m => {
            const isEditing = editingId === m.id;
            if (isEditing) {
              return (
                <tr key={m.id} className="bg-blue-50">
                  <td className="py-2 px-4">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border rounded" />
                  </td>
                  <td className="py-2 px-4">
                    <input value={form.size} onChange={e => parseSizeInput(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border rounded" placeholder="13x19" />
                  </td>
                  <td className="py-2 px-4">
                    <input type="number" value={form.sizeWidth} onChange={e => setForm(f => ({ ...f, sizeWidth: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 text-sm border rounded" />
                  </td>
                  <td className="py-2 px-4">
                    <input type="number" value={form.sizeHeight} onChange={e => setForm(f => ({ ...f, sizeHeight: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 text-sm border rounded" />
                  </td>
                  <td className="py-2 px-4">
                    <input type="number" value={form.pricePerM} onChange={e => setForm(f => ({ ...f, pricePerM: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 text-sm border rounded" />
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-500">{formatCurrency(form.pricePerM / 1000)}</td>
                  <td className="py-2 px-4">
                    <input type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 text-sm border rounded" />
                  </td>
                  <td className="py-2 px-4 text-sm font-bold text-blue-700">
                    {formatCurrency((form.pricePerM / 1000) * (1 + form.markup / 100))}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex gap-1">
                      <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancel">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 font-medium">{m.size}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{m.sizeWidth}"</td>
                <td className="py-3 px-4 text-sm text-gray-500">{m.sizeHeight}"</td>
                <td className="py-3 px-4 text-sm text-gray-700 font-medium">{formatCurrency(m.pricePerM)}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{formatCurrency(costPerSheet(m))}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{m.markup}%</td>
                <td className="py-3 px-4 text-sm font-bold text-blue-700">{formatCurrency(sellPerSheet(m))}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1">
                    <button onClick={() => handleStartEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === m.id ? (
                      <div className="flex gap-1 items-center">
                        <button onClick={() => handleDelete(m.id)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No materials found</p>
          </div>
        )}
      </Card>

      {/* Add Material Modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Material">
        <div className="space-y-4">
          <Input label="Material Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. 100lb Gloss Cover" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sheet Size</label>
              <input value={form.size} onChange={e => parseSizeInput(e.target.value)}
                placeholder="e.g. 13x19"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-[10px] text-gray-400 mt-1">Type "13x19" to auto-fill W/H</p>
            </div>
            <Input label="Width (in)" type="number" value={form.sizeWidth || ''} onChange={e => setForm(f => ({ ...f, sizeWidth: parseFloat(e.target.value) || 0 }))} />
            <Input label="Height (in)" type="number" value={form.sizeHeight || ''} onChange={e => setForm(f => ({ ...f, sizeHeight: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price per M (per 1,000 sheets)" type="number" value={form.pricePerM || ''} onChange={e => setForm(f => ({ ...f, pricePerM: parseFloat(e.target.value) || 0 }))} prefix="$" />
            <Input label="Markup %" type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: parseFloat(e.target.value) || 0 }))} suffix="%" />
          </div>
          {form.pricePerM > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Cost/sheet:</span><span className="font-medium">{formatCurrency(form.pricePerM / 1000)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sell/sheet:</span><span className="font-bold text-blue-700">{formatCurrency((form.pricePerM / 1000) * (1 + form.markup / 100))}</span></div>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!form.name || form.sizeWidth <= 0 || form.sizeHeight <= 0}>Add Material</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
