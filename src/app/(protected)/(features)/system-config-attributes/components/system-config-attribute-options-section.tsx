'use client';

import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetSystemConfigAttribute } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';

interface SystemConfigAttributeOptionsSectionProps {
  attributeId: number;
}

function transformEnumValue(enumValue?: string | null): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue as any;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SystemConfigAttributeOptionsSection({ attributeId }: SystemConfigAttributeOptionsSectionProps) {
  const { data: attribute, isLoading: isLoadingAttribute } = useGetSystemConfigAttribute(attributeId, {
    query: { enabled: !!attributeId },
  });

  const isEnumType = attribute?.attributeType === 'ENUM';

  const { data: options, isLoading: isLoadingOptions } = useGetAllSystemConfigAttributeOptions(
    {
      'attributeId.equals': attributeId,
      size: 1000,
      sort: ['sortOrder,asc'],
    },
    {
      query: { enabled: isEnumType },
    }
  );

  if (isLoadingAttribute) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="p-8 text-center text-muted-foreground">Loading attribute options...</div>
      </div>
    );
  }

  if (!attribute) return null;

  if (!isEnumType) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">Non-ENUM Attribute</h3>
              <p className="text-sm text-blue-700 mt-1">
                This attribute type ({transformEnumValue(attribute.attributeType)}) does not use predefined options.
                Values will be entered directly when creating product variants.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Attribute Options</h2>
          <p className="text-sm text-muted-foreground mt-1">Available options for this ENUM attribute</p>
        </div>
        <Button asChild size="sm">
          <Link href={`/system-config-attribute-options/new?attributeId=${attributeId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        {isLoadingOptions ? (
          <div className="p-8 text-center text-muted-foreground">Loading options...</div>
        ) : !options || options.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">No options configured for this attribute yet.</div>
            <div className="text-sm text-amber-600 mb-4">
              ⚠️ ENUM attributes require at least one option to be used in product variants
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/system-config-attribute-options/new?attributeId=${attributeId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Option
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      Code:{' '}
                      <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{option.code}</code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={option.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {transformEnumValue(option.status)}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/system-config-attribute-options/${option.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/system-config-attribute-options/${option.id}/edit`}>
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

