'use client';

import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';

interface SystemConfigAttributesSectionProps {
  systemConfigId: number;
}

function transformEnumValue(enumValue?: string | null): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue as any;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SystemConfigAttributesSection({ systemConfigId }: SystemConfigAttributesSectionProps) {
  const { data: attributes, isLoading } = useGetAllSystemConfigAttributes({
    'systemConfigId.equals': systemConfigId,
    size: 1000,
    sort: ['sortOrder,asc'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="p-8 text-center text-muted-foreground">Loading attributes...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Attributes</h2>
          <p className="text-sm text-muted-foreground mt-1">Attributes defined for this system config</p>
        </div>
        <Button asChild size="sm">
          <Link href={`/system-config-attributes/new?systemConfigId=${systemConfigId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Attribute
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        {!attributes || attributes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              No attributes configured for this system config yet.
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/system-config-attributes/new?systemConfigId=${systemConfigId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Attribute
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-medium">{attr.label}</h3>
                    <Badge variant="outline">{transformEnumValue(attr.attributeType)}</Badge>
                    {attr.isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    <Badge
                      variant={attr.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transformEnumValue(attr.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Name:{' '}
                    <code className="px-1 py-0.5 bg-gray-100 rounded">{attr.name}</code>
                    {attr.attributeType === 'ENUM' && (
                      <span className="ml-2 text-blue-600">
                        → Configure options in System Config Attribute Options
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/system-config-attributes/${attr.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/system-config-attributes/${attr.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

