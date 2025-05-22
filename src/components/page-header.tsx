import React from "react";

interface PageHeaderProps {
  children: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  children,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="space-y-1">
        {children}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}
