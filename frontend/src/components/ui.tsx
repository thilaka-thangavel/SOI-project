import React from 'react';
import { clsx } from 'clsx';
import type { RiskCategory, RainfallIntensity, DrainageCondition } from '../types';

// ─── Risk Badge ────────────────────────────────────────────────────────────────
interface RiskBadgeProps {
  category: RiskCategory | string;
  score?: number;
  className?: string;
}

export function RiskBadge({ category, score, className }: RiskBadgeProps) {
  const styles: Record<string, string> = {
    low: 'bg-green-100 text-green-800 border border-green-200',
    moderate: 'bg-amber-100 text-amber-800 border border-amber-200',
    high: 'bg-orange-100 text-orange-800 border border-orange-200',
    critical: 'bg-red-100 text-red-800 border border-red-200',
  };

  const labels: Record<string, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
      styles[category] || 'bg-gray-100 text-gray-800 border border-gray-200',
      className
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-green-600': category === 'low',
        'bg-amber-600': category === 'moderate',
        'bg-orange-600': category === 'high',
        'bg-red-600': category === 'critical',
      })} />
      {labels[category] || category}
      {score !== undefined && <span className="ml-0.5 opacity-75">({score.toFixed(0)})</span>}
    </span>
  );
}

// ─── Rainfall Badge ─────────────────────────────────────────────────────────────
interface RainfallBadgeProps {
  intensity: RainfallIntensity | string;
  className?: string;
}

export function RainfallBadge({ intensity, className }: RainfallBadgeProps) {
  const styles: Record<string, string> = {
    low: 'bg-blue-50 text-blue-700 border border-blue-200',
    moderate: 'bg-blue-100 text-blue-800 border border-blue-300',
    heavy: 'bg-blue-200 text-blue-900 border border-blue-400',
    very_heavy: 'bg-blue-800 text-white border border-blue-900',
  };
  const labels: Record<string, string> = {
    low: 'Low',
    moderate: 'Moderate',
    heavy: 'Heavy',
    very_heavy: 'Very Heavy',
  };
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      styles[intensity] || 'bg-gray-100 text-gray-800 border border-gray-200',
      className
    )}>
      {labels[intensity] || intensity}
    </span>
  );
}

// ─── Drainage Badge ─────────────────────────────────────────────────────────────
interface DrainageBadgeProps {
  condition: DrainageCondition | string;
  className?: string;
}

export function DrainageBadge({ condition, className }: DrainageBadgeProps) {
  const styles: Record<string, string> = {
    clear: 'bg-green-100 text-green-800 border border-green-200',
    partially_blocked: 'bg-amber-100 text-amber-800 border border-amber-200',
    blocked: 'bg-red-100 text-red-800 border border-red-200',
    unknown: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  const labels: Record<string, string> = {
    clear: 'Clear',
    partially_blocked: 'Partially Blocked',
    blocked: 'Blocked',
    unknown: 'Unknown',
  };
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      styles[condition] || 'bg-gray-100 text-gray-800',
      className
    )}>
      {labels[condition] || condition}
    </span>
  );
}

// ─── Synthetic Badge ────────────────────────────────────────────────────────────
export function SyntheticBadge() {
  return (
    <span className="synthetic-badge">
      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
      Synthetic Demo Data
    </span>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
    completed: 'bg-green-100 text-green-800 border border-green-200',
    cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
    under_review: 'bg-purple-100 text-purple-800 border border-purple-200',
    resolved: 'bg-green-100 text-green-800 border border-green-200',
    dismissed: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    under_review: 'Under Review',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
  };
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      styles[status] || 'bg-gray-100 text-gray-800',
      className
    )}>
      {labels[status] || status}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: boolean;
}

export function Card({ children, className, title, subtitle, actions, padding = true }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-card border border-slate-200', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>{children}</div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  variant?: 'blue' | 'orange' | 'red' | 'green' | 'purple';
  className?: string;
}

export function StatCard({ label, value, icon, trend, variant = 'blue', className }: StatCardProps) {
  const variants = {
    blue: 'stat-card-blue',
    orange: 'stat-card-orange',
    red: 'stat-card-red',
    green: 'stat-card-green',
    purple: 'stat-card-purple',
  };
  const iconColors = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };
  return (
    <div className={clsx(
      'rounded-xl p-5 border card-hover',
      variants[variant],
      variant === 'blue' ? 'border-blue-200' :
      variant === 'orange' ? 'border-orange-200' :
      variant === 'red' ? 'border-red-200' :
      variant === 'green' ? 'border-green-200' : 'border-purple-200',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && (
            <p className={clsx(
              'text-xs font-medium mt-2',
              trend.positive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl bg-white/60', iconColors[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx(
      'w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin',
      className
    )} />
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon && <div className="text-slate-400 mb-2">{icon}</div>}
      <p className="text-base font-semibold text-slate-600">{title}</p>
      {description && <p className="text-sm text-slate-400 max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <span className="text-red-600 text-xl">⚠</span>
      </div>
      <p className="text-base font-semibold text-red-600">Failed to load data</p>
      <p className="text-sm text-slate-500 max-w-sm">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Disclaimer Banner ────────────────────────────────────────────────────────
export function SyntheticDisclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm">
      <div className="text-purple-600 mt-0.5 flex-shrink-0">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-purple-800">Synthetic Demonstration Data</p>
        <p className="text-purple-700 mt-0.5">
          All data shown is synthetic and generated for demonstration purposes only.
          It does not represent actual government, environmental, or infrastructure records.
          Risk scores are experimental and not official flood forecasts.
        </p>
      </div>
    </div>
  );
}

// ─── Warning Banner ───────────────────────────────────────────────────────────
interface WarningBannerProps {
  message: string;
  className?: string;
}

export function WarningBanner({ message, className }: WarningBannerProps) {
  return (
    <div className={clsx('warning-banner', className)}>
      <div className="text-amber-600 flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-sm text-amber-800">{message}</p>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children, variant = 'primary', size = 'md', loading, icon, className, disabled, ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center gap-2 font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <select
        {...props}
        className={clsx(
          'px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none',
          error && 'border-red-300 focus:ring-red-500',
          className
        )}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <input
        {...props}
        className={clsx(
          'px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none',
          error && 'border-red-300 focus:ring-red-500',
          className
        )}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <textarea
        {...props}
        className={clsx(
          'px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none',
          error && 'border-red-300',
          className
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
interface ConfidenceBarProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBar({ confidence, className }: ConfidenceBarProps) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-10 text-right">{pct}%</span>
    </div>
  );
}

// ─── Risk Score Ring ──────────────────────────────────────────────────────────
interface RiskScoreRingProps {
  score: number;
  category: RiskCategory;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskScoreRing({ score, category, size = 'md' }: RiskScoreRingProps) {
  const sizes = { sm: 64, md: 96, lg: 128 };
  const dim = sizes[size];
  const radius = (dim - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colors: Record<RiskCategory, string> = {
    low: '#22c55e',
    moderate: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };

  const color = colors[category] || '#94a3b8';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={dim/2} cy={dim/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx={dim/2} cy={dim/2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={clsx('font-bold', size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-3xl')} style={{ color }}>
          {score.toFixed(0)}
        </span>
        {size !== 'sm' && <span className="text-xs text-slate-500 capitalize">{category}</span>}
      </div>
    </div>
  );
}

// ─── Factor Bar ───────────────────────────────────────────────────────────────
interface FactorBarProps {
  label: string;
  score: number;
  weight: number;
  contribution: number;
}

export function FactorBar({ label, score, weight, contribution }: FactorBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs">Weight: {(weight * 100).toFixed(0)}%</span>
          <span className="font-semibold text-slate-800">{score.toFixed(0)}/100</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">Contribution to total score: +{contribution.toFixed(1)} pts</p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-2xl w-full mx-4 animate-fade-in', widths[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}
