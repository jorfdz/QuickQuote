import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Card, Badge, PageHeader, Select } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';

export const OrderTracker: React.FC = () => {
  const { orders, workflows, updateOrder } = useStore();
  const navigate = useNavigate();
  const [activeWorkflow, setActiveWorkflow] = useState(workflows[0]?.id || '');

  const workflow = workflows.find(w => w.id === activeWorkflow) || workflows[0];
  const relevantOrders = orders.filter(o => o.workflowId === activeWorkflow && o.status !== 'canceled' && o.status !== 'completed');

  const getOrdersForStage = (stageId: string) => relevantOrders.filter(o => o.currentStageId === stageId);
  const getUnstartedOrders = () => relevantOrders.filter(o => !o.currentStageId);

  return (
    <div>
      <PageHeader title="Order Tracker" subtitle="Visual production board" actions={
        <Select value={activeWorkflow} onChange={e => setActiveWorkflow(e.target.value)}
          options={workflows.map(w => ({ value: w.id, label: w.name }))}
          label="" />
      } />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Unstarted column */}
        <div className="flex-shrink-0 w-64">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <h3 className="font-semibold text-sm text-gray-700">Queue</h3>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{getUnstartedOrders().length}</span>
          </div>
          <div className="space-y-2 min-h-32">
            {getUnstartedOrders().map(order => (
              <KanbanCard key={order.id} order={order} onNavigate={() => navigate(`/orders/${order.id}`)}
                onMoveToStage={(stageId) => updateOrder(order.id, { currentStageId: stageId })}
                stages={workflow?.stages || []} />
            ))}
          </div>
        </div>

        {/* Workflow stages */}
        {workflow?.stages.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              <h3 className="font-semibold text-sm text-gray-700">{stage.name}</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: stage.color + '20', color: stage.color }}>
                {getOrdersForStage(stage.id).length}
              </span>
            </div>
            <div className="space-y-2 min-h-32 p-2 rounded-xl bg-gray-50/60">
              {getOrdersForStage(stage.id).map(order => (
                <KanbanCard key={order.id} order={order} onNavigate={() => navigate(`/orders/${order.id}`)}
                  onMoveToStage={(stageId) => updateOrder(order.id, { currentStageId: stageId })}
                  stages={workflow?.stages || []} currentStageColor={stage.color} />
              ))}
              {getOrdersForStage(stage.id).length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl h-20 flex items-center justify-center">
                  <span className="text-xs text-gray-300">Drop here</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {workflow?.stages.map(stage => {
          const count = getOrdersForStage(stage.id).length;
          const value = getOrdersForStage(stage.id).reduce((s, o) => s + o.total, 0);
          return (
            <Card key={stage.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs font-semibold text-gray-600">{stage.name}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400">{formatCurrency(value)}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─── KANBAN CARD ─────────────────────────────────────────────────────────────

interface KanbanCardProps {
  order: { id: string; number: string; title: string; customerName?: string; total: number; dueDate?: string; status: string };
  onNavigate: () => void;
  onMoveToStage: (stageId: string) => void;
  stages: { id: string; name: string; color: string }[];
  currentStageColor?: string;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order, onNavigate, onMoveToStage, stages, currentStageColor }) => {
  const isOverdue = order.dueDate && new Date(order.dueDate) < new Date();
  const [showMove, setShowMove] = useState(false);

  return (
    <div className={`bg-white rounded-xl border p-3 shadow-sm cursor-pointer hover:shadow-md transition-all ${isOverdue ? 'border-red-200' : 'border-gray-100'}`} onClick={onNavigate}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono font-bold text-gray-400">{order.number}</span>
        {currentStageColor && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStageColor }} />}
      </div>
      <p className="text-xs font-semibold text-gray-900 leading-tight mb-1">{order.title}</p>
      <p className="text-[10px] text-gray-500 mb-2">{order.customerName}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700">{formatCurrency(order.total)}</span>
        {order.dueDate && (
          <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            {isOverdue ? '⚠️ ' : '📅 '}{formatDate(order.dueDate)}
          </span>
        )}
      </div>
      {/* Quick move */}
      <div className="mt-2 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <select className="w-full text-[10px] bg-gray-50 border-0 rounded p-1 text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-300"
          onChange={e => { if (e.target.value) { onMoveToStage(e.target.value); e.target.value = ''; } }} defaultValue="">
          <option value="" disabled>Move to stage...</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </div>
  );
};
