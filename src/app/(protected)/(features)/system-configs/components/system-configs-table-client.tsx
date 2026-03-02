'use client';

import { useMemo } from 'react';
import { EntityTablePage } from '@/entity-library';
import { Button } from '@/components/ui/button';
import { InlinePermissionGuard } from '@/core/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { systemConfigEntityConfig } from '../config/entity.config';

export function SystemConfigsTableClient() {
  const config = useMemo(
    () => ({
      ...systemConfigEntityConfig,
      toolbar: {
        ...systemConfigEntityConfig.toolbar,
        theme: 'sidebar',
        left: (
          <InlinePermissionGuard requiredPermission="systemConfig:create">
            <Button asChild size="lg" className="gap-2 btn-sidebar-accent">
              <Link href="/system-configs/new">
                <Plus className="h-4 w-4" />
                Create System Config
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
