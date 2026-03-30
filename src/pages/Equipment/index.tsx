import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useStore } from '../../store';
import { Button, SearchInput, Card, PageHeader, Table, Modal, Input, Select, Textarea } from '../../components/ui';
import { formatCurrency } from '../../data/mockData';
import { nanoid } from '../../utils/nanoid';
import type { EquipmentType } from '../../types';

const EQUIPMENT_TYPES = ['digital_press', 'offset_press', 'wide_format_printer', 'cutter', 'laminator', 'folder', 'bindery', 'finishing', 'sign_production', 'other'];

export const Equipment: React.FC = () => {
  const { equipment, addEquipment, updateEquipment } = useStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [form, setForm] = useState({ name: '', model: '', manufacturer: '', type: 'digital_press' as EquipmentType, width: undefined as number | undefined, speed: undefined as number | undefined, speedUnit: 'sqft_hr' as any, costPerHour: 0, setupCost: 0, notes: '' });

  const filtered = equipment.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.model || '').toLowerCase().includes(search.toLowerCase()));

  const handleAIFill = () => {
    const model = aiModel.toLowerCase();
    if (model.includes('hp latex 800')) {
      setForm(f => ({ ...f, name: 'HP Latex 800W', manufacturer: 'HP', model: 'Latex 800W', type: 'wide_format_printer', width: 64, speed: 215, speedUnit: 'sqft_hr', costPerHour: 45, setupCost: 15 }));
    } else if (model.includes('hp indigo')) {
      setForm(f => ({ ...f, name: 'HP Indigo 7K', manufacturer: 'HP', model: 'Indigo 7K', type: 'digital_press', speed: 2700, speedUnit: 'sheets_hr', costPerHour: 125, setupCost: 25 }));
    } else if (model.includes('roland')) {
      setForm(f => ({ ...f, name: 'Roland VG3-540', manufacturer: 'Roland', model: 'VG3-540', type: 'wide_format_printer', width: 54, speed: 180, speedUnit: 'sqft_hr', costPerHour: 38, setupCost: 12 }));
    }
    setAiModel('');
  };

  const handleAdd = () => {
    addEquipment({ id: nanoid(), ...form, active: true, createdAt: new Date().toISOString() });
    setShowNew(false);
  };

  return (
    <div>
      <PageHeader title="Equipment" subtitle={`${equipment.length} equipment items`}
        actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNew(true)}>Add Equipment</Button>}
      />
      <Card className="mb-4"><div className="flex gap-4 px-4 py-3"><SearchInput value={search} onChange={setSearch} placeholder="Search equipment..." /></div></Card>
      <Card>
        <Table headers={['Name', 'Type', 'Width', 'Speed', 'Cost/Hour', 'Setup', 'Active', '']}>
          {filtered.map(eq => (
            <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <p className="text-sm font-semibold text-gray-900">{eq.name}</p>
                <p className="text-xs text-gray-400">{eq.manufacturer} {eq.model}</p>
              </td>
              <td className="py-3 px-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{eq.type.replace('_', ' ')}</span></td>
              <td className="py-3 px-4 text-sm text-gray-500">{eq.width ? `${eq.width}"` : '—'}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{eq.speed ? `${eq.speed} ${eq.speedUnit?.replace('_', '/')}` : '—'}</td>
              <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(eq.costPerHour)}/hr</td>
              <td className="py-3 px-4 text-sm text-gray-500">{eq.setupCost ? formatCurrency(eq.setupCost) : '—'}</td>
              <td className="py-3 px-4">
                <button onClick={() => updateEquipment(eq.id, { active: !eq.active })}
                  className={`w-9 h-5 rounded-full transition-colors ${eq.active ? 'bg-emerald-500' : 'bg-gray-200'} relative`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${eq.active ? 'left-4' : 'left-0.5'}`} />
                </button>
              </td>
              <td className="py-3 px-4"><Button size="sm" variant="ghost">Edit</Button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Equipment" size="lg">
        <div className="space-y-4">
          {/* AI Model Lookup */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> AI Model Lookup — type a model name to auto-fill specs</p>
            <div className="flex gap-2">
              <input value={aiModel} onChange={e => setAiModel(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAIFill()}
                placeholder='Try: "HP Latex 800W" or "HP Indigo 7K" or "Roland VG3-540"'
                className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300" />
              <Button variant="primary" size="sm" onClick={handleAIFill}>Look Up</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Equipment Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HP Latex 800W" />
            <Select label="Equipment Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EquipmentType }))}
              options={EQUIPMENT_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Manufacturer" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
            <Input label="Model #" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Input label="Max Width (in)" type="number" value={form.width || ''} onChange={e => setForm(f => ({ ...f, width: parseFloat(e.target.value) || undefined }))} />
            <Input label="Speed" type="number" value={form.speed || ''} onChange={e => setForm(f => ({ ...f, speed: parseFloat(e.target.value) || undefined }))} />
            <Select label="Speed Unit" value={form.speedUnit} onChange={e => setForm(f => ({ ...f, speedUnit: e.target.value as any }))}
              options={[{ value: 'sqft_hr', label: 'sqft/hr' }, { value: 'sheets_hr', label: 'sheets/hr' }, { value: 'linear_ft_hr', label: 'linear ft/hr' }]} />
            <Input label="Cost/Hour ($)" type="number" value={form.costPerHour} onChange={e => setForm(f => ({ ...f, costPerHour: parseFloat(e.target.value) || 0 }))} prefix="$" />
          </div>
          <Input label="Setup Cost ($)" type="number" value={form.setupCost} onChange={e => setForm(f => ({ ...f, setupCost: parseFloat(e.target.value) || 0 }))} prefix="$" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={!form.name}>Add Equipment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
