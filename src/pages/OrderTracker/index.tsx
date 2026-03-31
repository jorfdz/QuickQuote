import React, { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Clock3, GripVertical, Layers3, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Card, PageHeader } from '../../components/ui';
import { formatCurrency, formatDate } from '../../data/mockData';
import type { OrderItem } from '../../types';

type StageColumn = {
  id: string;
  name: string;
  color: string;
  isQueue?: boolean;
};

type TrackerItemCard = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderTitle: string;
  customerName?: string;
  dueDate?: string;
  total: number;
  lineItem: OrderItem;
  stageId: string;
};

const QUEUE_STAGE_ID = '__queue__';

export const OrderTracker: React.FC = () => {
  const { orders, workflows, updateOrder, companySettings } = useStore();
  const navigate = useNavigate();
  const activeBoards = workflows.filter((workflow) => workflow.isActive);
  const [activeWorkflowId, setActiveWorkflowId] = useState(activeBoards[0]?.id || workflows[0]?.id || '');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [boardsCollapsed, setBoardsCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const workflow = activeBoards.find((board) => board.id === activeWorkflowId)
    || workflows.find((board) => board.id === activeWorkflowId)
    || activeBoards[0]
    || workflows[0];

  useEffect(() => {
    if (workflow?.id && workflow.id !== activeWorkflowId) {
      setActiveWorkflowId(workflow.id);
    }
  }, [activeWorkflowId, workflow]);

  const columns = useMemo<StageColumn[]>(() => {
    if (!workflow) return [];
    return [
      { id: QUEUE_STAGE_ID, name: 'Queue', color: '#94a3b8', isQueue: true },
      ...workflow.stages
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((stage) => ({
          id: stage.id,
          name: stage.name,
          color: stage.color,
        })),
    ];
  }, [workflow]);

  const trackerItems = useMemo<TrackerItemCard[]>(() => {
    if (!workflow) return [];

    return orders
      .filter((order) => order.workflowId === workflow.id && order.status !== 'canceled' && order.status !== 'completed')
      .flatMap((order) => order.lineItems.map((lineItem) => {
        const stageId = lineItem.workflowStageId || order.currentStageId || QUEUE_STAGE_ID;
        return {
          id: lineItem.id,
          orderId: order.id,
          orderNumber: order.number,
          orderTitle: order.title,
          customerName: order.customerName,
          dueDate: order.dueDate,
          total: lineItem.sellPrice || order.total,
          lineItem,
          stageId,
        };
      }));
  }, [orders, workflow]);

  const itemsByStage = useMemo(() => {
    const next = new Map<string, TrackerItemCard[]>();
    columns.forEach((column) => next.set(column.id, []));
    trackerItems.forEach((item) => {
      const targetStageId = next.has(item.stageId) ? item.stageId : QUEUE_STAGE_ID;
      const bucket = next.get(targetStageId) || [];
      bucket.push(item);
      next.set(targetStageId, bucket);
    });
    columns.forEach((column) => {
      const items = next.get(column.id) || [];
      items.sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.orderNumber.localeCompare(b.orderNumber);
      });
      next.set(column.id, items);
    });
    return next;
  }, [columns, trackerItems]);

  const boardStats = useMemo(() => {
    return activeBoards.map((board) => {
      const boardOrders = orders.filter((order) => order.workflowId === board.id && order.status !== 'canceled' && order.status !== 'completed');
      return {
        id: board.id,
        orderCount: boardOrders.length,
        itemCount: boardOrders.reduce((sum, order) => sum + order.lineItems.length, 0),
        dueSoonCount: boardOrders.filter((order) => order.dueDate && new Date(order.dueDate) <= endOfTomorrow()).length,
      };
    });
  }, [activeBoards, orders]);

  const brandColor = companySettings.primaryBrandColor || '#2563eb';
  const activeDragItem = trackerItems.find((item) => item.id === activeDragId) || null;

  const moveItemToStage = (itemId: string, stageId: string) => {
    const item = trackerItems.find((entry) => entry.id === itemId);
    if (!item || !workflow) return;

    const nextStageId = stageId === QUEUE_STAGE_ID ? undefined : stageId;
    const order = orders.find((entry) => entry.id === item.orderId);
    if (!order) return;

    updateOrder(order.id, {
      workflowId: workflow.id,
      currentStageId: nextStageId,
      lineItems: order.lineItems.map((lineItem) => (
        lineItem.id === item.id
          ? { ...lineItem, workflowStageId: nextStageId }
          : lineItem
      )),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const overItem = trackerItems.find((item) => item.id === overId);
    const targetStageId = overItem?.stageId || overId;
    if (!columns.find((column) => column.id === targetStageId)) return;

    moveItemToStage(activeId, targetStageId);
  };

  if (!workflow) {
    return (
      <div>
        <PageHeader title="Order Tracker" subtitle="Visual production board" />
        <Card className="p-10 text-center text-sm text-gray-500">
          No active Order Tracker boards are configured. Add one in Settings to start tracking production.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-104px)] flex-col gap-6">
      <PageHeader title="Order Tracker" subtitle="Move production items across boards and stages in real time." />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            <Layers3 className="h-3.5 w-3.5" />
            Active Boards
          </div>
          <button
            type="button"
            onClick={() => setBoardsCollapsed((current) => !current)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            {boardsCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {boardsCollapsed ? 'Show Boards' : 'Collapse Boards'}
          </button>
        </div>
        {!boardsCollapsed && (
        <div className="grid gap-3 lg:grid-cols-3">
          {activeBoards.map((board) => {
            const stats = boardStats.find((entry) => entry.id === board.id);
            const selected = board.id === workflow.id;
            return (
              <button
                key={board.id}
                onClick={() => setActiveWorkflowId(board.id)}
                className={`rounded-xl border p-4 text-left transition-all ${selected ? 'text-white shadow-lg' : 'border-gray-200 bg-white hover:border-slate-300 hover:shadow-md'}`}
                style={selected ? {
                  borderColor: withAlpha(brandColor, 0.8),
                  backgroundImage: `linear-gradient(135deg, ${withAlpha(brandColor, 0.96)}, ${withAlpha(brandColor, 0.72)})`,
                  boxShadow: `0 20px 35px ${withAlpha(brandColor, 0.18)}`,
                } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`text-sm font-semibold ${selected ? 'text-white' : 'text-gray-900'}`}>{board.name}</div>
                    <p className={`mt-1 text-xs leading-5 ${selected ? 'text-slate-200' : 'text-gray-500'}`}>{board.description || 'No board description provided.'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${selected ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                    {board.isDefault ? 'Default' : 'Active'}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div>
                    <div className={`text-lg font-bold ${selected ? 'text-white' : 'text-gray-900'}`}>{stats?.orderCount || 0}</div>
                    <div className={`text-[11px] ${selected ? 'text-slate-300' : 'text-gray-500'}`}>orders</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${selected ? 'text-white' : 'text-gray-900'}`}>{stats?.itemCount || 0}</div>
                    <div className={`text-[11px] ${selected ? 'text-slate-300' : 'text-gray-500'}`}>items</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${selected ? 'text-white' : 'text-gray-900'}`}>{stats?.dueSoonCount || 0}</div>
                    <div className={`text-[11px] ${selected ? 'text-slate-300' : 'text-gray-500'}`}>due soon</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/80 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{workflow.name}</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">{workflow.description || 'Track production items across stages.'}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
              <MoveRight className="h-3.5 w-3.5 text-slate-400" />
              Drag items between columns
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
              {trackerItems.length} active items
            </span>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-3">
            {columns.map((column) => (
              <StageLane
                key={column.id}
                column={column}
                items={itemsByStage.get(column.id) || []}
                onNavigate={(orderId) => navigate(`/orders/${orderId}`)}
                brandColor={brandColor}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragItem ? (
              <TrackerCard item={activeDragItem} onNavigate={() => undefined} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>
    </div>
  );
};

const StageLane: React.FC<{
  column: StageColumn;
  items: TrackerItemCard[];
  onNavigate: (orderId: string) => void;
  brandColor: string;
}> = ({ column, items, onNavigate, brandColor }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex h-full w-[320px] flex-shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color }} />
        <h3 className="text-sm font-semibold text-gray-800">{column.name}</h3>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: `${column.color}18`, color: column.color }}
        >
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-0 flex-1 overflow-y-auto rounded-xl border p-3 transition-colors ${isOver ? 'bg-white shadow-inner' : 'border-white/70 bg-white/72'}`}
        style={isOver ? { borderColor: withAlpha(brandColor, 0.45), boxShadow: `inset 0 0 0 1px ${withAlpha(brandColor, 0.12)}` } : undefined}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item) => (
              <SortableTrackerCard key={item.id} item={item} onNavigate={() => onNavigate(item.orderId)} />
            ))}
            {items.length === 0 && (
              <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
                Drop item here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

const SortableTrackerCard: React.FC<{
  item: TrackerItemCard;
  onNavigate: () => void;
}> = ({ item, onNavigate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-60' : ''}
    >
      <TrackerCard item={item} onNavigate={onNavigate} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
};

const TrackerCard: React.FC<{
  item: TrackerItemCard;
  onNavigate: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}> = ({ item, onNavigate, dragHandleProps, isDragging = false }) => {
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();

  return (
    <div
      className={`group rounded-lg border bg-white p-3 shadow-sm transition-all ${isDragging ? 'rotate-1 shadow-xl' : 'hover:-translate-y-0.5 hover:shadow-md'} ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{item.orderNumber}</div>
          <div className="mt-1 text-sm font-semibold leading-5 text-gray-900">{item.lineItem.description || item.orderTitle}</div>
        </div>
        <button
          {...dragHandleProps}
          type="button"
          className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
          aria-label="Drag order item"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <button type="button" onClick={onNavigate} className="w-full text-left">
        <p className="text-xs text-gray-500">{item.customerName || 'No customer assigned'}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
            Qty {item.lineItem.quantity}
          </span>
          <span className="text-sm font-semibold text-gray-800">{formatCurrency(item.total)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-gray-400">{item.lineItem.productFamily.replace(/_/g, ' ')}</span>
          <span className={isOverdue ? 'font-semibold text-red-500' : 'text-gray-400'}>
            {item.dueDate ? formatDate(item.dueDate) : 'No due date'}
          </span>
        </div>
      </button>
    </div>
  );
};

const endOfTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(23, 59, 59, 999);
  return date;
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
