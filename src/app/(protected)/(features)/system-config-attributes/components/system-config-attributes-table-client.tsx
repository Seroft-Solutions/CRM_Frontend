'use client';

import { useMemo } from 'react';
import { EntityTablePage } from '@/entity-library';
import { Button } from '@/components/ui/button';
import { InlinePermissionGuard } from '@/core/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { systemConfigAttributeEntityConfig } from '../config/entity.config';

export function SystemConfigAttributesTableClient() {
  const config = useMemo(
    () => ({
      ...systemConfigAttributeEntityConfig,
      toolbar: {
        ...systemConfigAttributeEntityConfig.toolbar,
        theme: 'sidebar',
        left: (
          <InlinePermissionGuard requiredPermission="systemConfigAttribute:create">
            <Button asChild size="lg" className="gap-2 btn-sidebar-accent">
              <Link href="/system-config-attributes/new">
                <Plus className="h-4 w-4" />
                Create Config Attribute
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
