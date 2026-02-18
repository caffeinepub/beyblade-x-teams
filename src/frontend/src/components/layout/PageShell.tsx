import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function PageShell({ children, title, description, maxWidth = 'xl' }: PageShellProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className={`mx-auto ${maxWidthClass} w-full`}>
      {(title || description) && (
        <div className="mb-8 space-y-2">
          {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
