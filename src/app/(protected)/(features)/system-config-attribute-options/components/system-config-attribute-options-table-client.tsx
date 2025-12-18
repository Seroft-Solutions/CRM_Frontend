'use client';

import { useMemo } from 'react';
import { EntityTablePage } from '@/entity-library';
import { Button } from '@/components/ui/button';
import { InlinePermissionGuard } from '@/core/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { systemConfigAttributeOptionEntityConfig } from '../config/entity.config';

export function SystemConfigAttributeOptionsTableClient() {
  const config = useMemo(
    () => ({
      ...systemConfigAttributeOptionEntityConfig,
      toolbar: {
        ...systemConfigAttributeOptionEntityConfig.toolbar,
        theme: 'sidebar',
        left: (
          <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:create">
            <Button asChild size="lg" className="gap-2 btn-sidebar-accent">
              <Link href="/system-config-attribute-options/new">
                <Plus className="h-4 w-4" />
                Create Attribute Option
              </Link>
            </Button>
          </InlinePermissionGuard>
        ),
      },
    }),
    []
  );

  return <EntityTablePage config={config} />;
}
