'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface EntityLayoutProps {
  children: ReactNode;
  title: string;
  entityName: string;
  entityNamePlural: string;
  basePath: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export default function EntityLayout({
  children,
  title,
  entityName,
  entityNamePlural,
  basePath,
  breadcrumbs,
  actions,
}: EntityLayoutProps) {
  const pathname = usePathname();
  
  // Determine if we're in a detail view, edit view, or create view
  const isListView = pathname === basePath;
  const isCreateView = pathname === `${basePath}/new`;
  
  // Build default breadcrumbs if none provided
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: entityNamePlural, href: basePath },
  ];
  
  if (isCreateView) {
    defaultBreadcrumbs.push({ label: `Create ${entityName}` });
  } else if (!isListView) {
    // Assume we're in a detail or edit view
    const isEditView = pathname.endsWith('/edit');
    const id = pathname.split('/').slice(-1)[0];
    const entityId = isEditView ? pathname.split('/').slice(-2)[0] : id;
    
    defaultBreadcrumbs.push({ label: `${entityName} ${entityId}`, href: `${basePath}/${entityId}` });
    
    if (isEditView) {
      defaultBreadcrumbs.push({ label: 'Edit' });
    }
  }
  
  const finalBreadcrumbs = breadcrumbs || defaultBreadcrumbs;
  
  // Default action is a "Create" button in list view
  const defaultActions = isListView ? (
    <Button asChild>
      <Link href={`${basePath}/new`}>
        <Plus className="mr-2 h-4 w-4" />
        Create {entityName}
      </Link>
    </Button>
  ) : null;
  
  const finalActions = actions || defaultActions;
  
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-muted-foreground">
        {finalBreadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
            {item.href ? (
              <Link 
                href={item.href} 
                className="hover:text-foreground transition-colors"
              >
                {index === 0 ? (
                  <span className="flex items-center">
                    <Home className="mr-1 h-4 w-4" />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </div>
        ))}
      </nav>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {finalActions}
      </div>
      
      {/* Main content */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
