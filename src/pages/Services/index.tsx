import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wrench, Scissors, Clock, Handshake } from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { Card, PageHeader } from '../../components/ui';

// ─── Service Box Config ─────────────────────────────────────────────────────

interface ServiceBox {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  hoverColor: string;
  countKey: 'materials' | 'equipment' | 'finishing' | 'labor' | 'brokered';
}

const SERVICE_BOXES: ServiceBox[] = [
  {
    title: 'Materials',
    subtitle: 'Paper, substrates & media',
    icon: <Package className="w-7 h-7" />,
    path: '/materials',
    color: 'bg-blue-50 text-blue-600',
    hoverColor: 'hover:border-blue-300 hover:shadow-md',
    countKey: 'materials',
  },
  {
    title: 'Equipment',
    subtitle: 'Printers, presses & devices',
    icon: <Wrench className="w-7 h-7" />,
    path: '/equipment',
    color: 'bg-emerald-50 text-emerald-600',
    hoverColor: 'hover:border-emerald-300 hover:shadow-md',
    countKey: 'equipment',
  },
  {
    title: 'Finishing',
    subtitle: 'Cutting, folding & binding',
    icon: <Scissors className="w-7 h-7" />,
    path: '/finishing',
    color: 'bg-purple-50 text-purple-600',
    hoverColor: 'hover:border-purple-300 hover:shadow-md',
    countKey: 'finishing',
  },
  {
    title: 'Labor',
    subtitle: 'Design, assembly & installation',
    icon: <Clock className="w-7 h-7" />,
    path: '/labor',
    color: 'bg-amber-50 text-amber-600',
    hoverColor: 'hover:border-amber-300 hover:shadow-md',
    countKey: 'labor',
  },
  {
    title: 'Brokered',
    subtitle: 'Outsourced & vendor services',
    icon: <Handshake className="w-7 h-7" />,
    path: '/brokered',
    color: 'bg-rose-50 text-rose-600',
    hoverColor: 'hover:border-rose-300 hover:shadow-md',
    countKey: 'brokered',
  },
];

// ─── Services Hub ───────────────────────────────────────────────────────────

export const Services: React.FC = () => {
  const navigate = useNavigate();
  const store = usePricingStore();

  const getCount = (key: ServiceBox['countKey']): number => {
    const data = store[key];
    return Array.isArray(data) ? data.length : 0;
  };

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Manage pricing services for materials, equipment, finishing, labor, and brokered work"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_BOXES.map((box) => {
          const count = getCount(box.countKey);
          return (
            <Card
              key={box.title}
              className={`p-6 transition-all duration-200 cursor-pointer border border-gray-100 ${box.hoverColor}`}
              onClick={() => navigate(box.path)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-4 rounded-xl ${box.color}`}>
                  {box.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{box.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{box.subtitle}</p>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {count} {count === 1 ? 'service' : 'services'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
