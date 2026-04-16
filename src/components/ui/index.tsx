import React from 'react';
import { X, ChevronDown, Search, Check } from 'lucide-react';

// ─── BUTTON ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'md', loading, icon, children, className = '', style, ...props }) => {
  const variantClasses = {
    // primary uses CSS variable — no hardcoded color
    primary: 'text-white border',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300 border border-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-red-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300 border border-transparent',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 border border-emerald-600',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs rounded-md',
    md: 'px-3.5 py-1.5 text-sm rounded-md',
    lg: 'px-4 py-2 text-sm rounded-md',
  };
  // For primary, inject CSS variable colors via inline style
  const brandStyle: React.CSSProperties = variant === 'primary' ? {
    backgroundColor: 'var(--brand)',
    borderColor: 'var(--brand)',
    ...style,
  } : (style || {});

  return (
    <button
      className={`inline-flex items-center gap-1.5 font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizes[size]} ${className}`}
      style={brandStyle}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
      {children}
    </button>
  );
};

// ─── INPUT ───────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, prefix, suffix, className = '', ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
      <input
        className={`w-full px-3 py-1.5 text-sm bg-white border ${error ? 'border-red-400' : 'border-gray-150'} rounded-md brand-focus placeholder-gray-400 transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${className}`}
        {...props}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// ─── TEXTAREA ────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, className = '', ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <textarea className={`w-full px-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md brand-focus placeholder-gray-400 transition-all resize-none ${className}`} {...props} />
  </div>
);

// ─── SELECT ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>}
    <div className="relative">
      <select className={`w-full px-3 py-1.5 pr-8 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent appearance-none ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ─── BADGE ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange' | string;
  className?: string;
}
export const Badge: React.FC<BadgeProps> = ({ label, children, color, className = '' }) => {
  const text = (label || (typeof children === 'string' ? children : '')) as string;
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-300',
    hot: 'bg-red-100 text-red-800 border border-red-300',
    cold: 'bg-sky-100 text-sky-800 border border-sky-300',
    won: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    lost: 'bg-gray-200 text-gray-600 border border-gray-300',
    in_progress: 'bg-blue-100 text-blue-800 border border-blue-300',
    on_hold: 'bg-amber-100 text-amber-800 border border-amber-300',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    canceled: 'bg-gray-200 text-gray-600 border border-gray-300',
    draft: 'bg-gray-100 text-gray-700 border border-gray-300',
    sent: 'bg-blue-100 text-blue-800 border border-blue-300',
    posted: 'bg-purple-100 text-purple-800 border border-purple-300',
    paid: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    overdue: 'bg-red-100 text-red-800 border border-red-300',
    void: 'bg-gray-200 text-gray-500 border border-gray-300',
    received: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    acknowledged: 'bg-blue-100 text-blue-800 border border-blue-300',
    partial: 'bg-amber-100 text-amber-800 border border-amber-300',
    vip: 'bg-purple-100 text-purple-800 border border-purple-300',
    'long-term': 'bg-blue-100 text-blue-800 border border-blue-300',
  };
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    gray: 'bg-gray-100 text-gray-500 border border-gray-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  };
  const cls = color
    ? (colorMap[color] || color)
    : (statusColors[text.toLowerCase().replace(/ /g, '_')] || 'bg-gray-100 text-gray-600 border border-gray-200');
  const display = children ?? text.replace(/_/g, ' ');
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${cls} ${className}`}>{display}</span>;
};

// ─── MODAL ───────────────────────────────────────────────────────────────────

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'half' | 'full'; className?: string; }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl', '2xl': 'max-w-5xl', '4xl': 'max-w-4xl', half: 'max-w-[50vw]', full: 'max-w-[80vw]' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3.5">{children}</div>
      </div>
    </div>
  );
};

// ─── CARD ────────────────────────────────────────────────────────────────────

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div className={`bg-white border border-gray-100 rounded-lg ${onClick ? 'cursor-pointer hover:border-gray-200 transition-all' : ''} ${className}`} onClick={onClick}>{children}</div>
);

// ─── SEARCH INPUT ────────────────────────────────────────────────────────────

export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-150 rounded-md focus:outline-none focus:ring-1 focus:ring-[#F890E7] focus:border-transparent w-80 placeholder-gray-400"
    />
  </div>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────

export const StatCard: React.FC<{ title: string; value: string; subtitle?: string; icon: React.ReactNode; color: string; trend?: string }> = ({ title, value, subtitle, icon, color, trend }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        {trend && <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{trend}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
    </div>
  </Card>
);

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">{icon}</div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 max-w-xs">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────

interface ConfirmDialogProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; }
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
    </div>
  </Modal>
);

// ─── TABLE ───────────────────────────────────────────────────────────────────

export const Table: React.FC<{ headers: (React.ReactNode | string)[]; children: React.ReactNode; className?: string }> = ({ headers, children, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          {headers.map((h, i) => (
            <th key={i} className="text-left py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">{children}</tbody>
    </table>
  </div>
);

// ─── CHECKBOX ────────────────────────────────────────────────────────────────

interface CheckboxProps { checked: boolean; onChange: (v: boolean) => void; label?: string; }
export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`} onClick={() => onChange(!checked)}>
      {checked && <Check className="w-3 h-3 text-white" />}
    </div>
    {label && <span className="text-sm text-gray-700">{label}</span>}
  </label>
);

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode; back?: () => void }> = ({ title, subtitle, actions, back }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      {back && (
        <button onClick={back} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ─── TABS ────────────────────────────────────────────────────────────────────

interface TabsProps { tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void; }
export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 border-b border-gray-100 mb-4">
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium border-b-2 transition-all -mb-px ${active === tab.id ? 'border-[#F890E7] text-[#F890E7]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
        {tab.label}
        {tab.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === tab.id ? 'bg-pink-100 text-[#F890E7]' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>}
      </button>
    ))}
  </div>
);
