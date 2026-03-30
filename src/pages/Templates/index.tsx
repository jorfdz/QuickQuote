import React, { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Card, PageHeader } from '../../components/ui';

export const Templates: React.FC = () => {
  const { templates, updateTemplate } = useStore();
  return (
    <div>
      <PageHeader title="Templates & Favorites" subtitle="Reusable quote line items for fast quoting" actions={<Button variant="primary" icon={<Plus className="w-4 h-4" />}>New Template</Button>} />
      <div className="grid grid-cols-3 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl border">{t.icon}</div>
                <div><h3 className="font-semibold text-sm text-gray-900">{t.name}</h3><p className="text-xs text-gray-400 capitalize">{t.productFamily.replace('_', ' ')}</p></div>
              </div>
              <button onClick={() => updateTemplate(t.id, { isFavorite: !t.isFavorite })}><Star className={`w-4 h-4 ${t.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} /></button>
            </div>
            {t.description && <p className="text-xs text-gray-500 mb-3">{t.description}</p>}
            <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Used {t.usageCount}x</span><Button size="sm" variant="ghost">Edit</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
};
