import { cn } from '@/lib/utils';

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default'
}) {
  const variants = {
    default: 'bg-card border-border',
    primary: 'gradient-header text-primary-foreground',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
  };

  return (
    <div className={cn(
      'rounded-xl border p-5 shadow-card animate-fade-in',
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-xs font-medium uppercase tracking-wide',
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold mt-1',
            variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm mt-1',
              variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'p-2.5 rounded-lg',
            variant === 'primary' ? 'bg-white/10' : 'bg-secondary'
          )}>
            <Icon size={22} className={variant === 'primary' ? 'text-primary-foreground' : 'text-primary'} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <span className={cn(
            'text-sm font-medium',
            trend > 0 ? 'text-success' : 'text-destructive'
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-sm text-muted-foreground ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
