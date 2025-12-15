'use client';

import { useGetSystemConfigAttribute } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { PermissionGuard } from '@/core/auth';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function SystemConfigAttributeDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, error } = useGetSystemConfigAttribute(parseInt(id));
  const { data: options, isLoading: isLoadingOptions } = useGetAllSystemConfigAttributeOptions({
    'attributeId.equals': parseInt(id),
    size: 1000,
    sort: ['sortOrder,asc'],
  }, {
    query: { enabled: data?.attributeType === 'ENUM' },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-500">Error loading config attribute</div>;
  }

  const isEnumType = data.attributeType === 'ENUM';

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttribute:read"
      unauthorizedTitle="Access Denied to View Config Attribute"
      unauthorizedDescription="You don't have permission to view config attribute details."
    >
      <div className="space-y-6">
        <div className="feature-header bg-[oklch(0.45_0.06_243)] rounded-lg p-6 shadow-lg relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">Config Attribute Details</h1>
                <p className="text-blue-100">View attribute details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/system-config-attributes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Link>
              </Button>
              {data.systemConfig?.id && (
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/system-configs/${data.systemConfig.id}`}>
                    View Config
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Link href={`/system-config-attributes/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">ID</label>
              <p className="mt-1 text-base">{data.id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-base font-semibold">
                <code className="px-2 py-1 bg-gray-100 rounded">{data.name}</code>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Label</label>
              <p className="mt-1 text-base">{data.label}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Attribute Type</label>
              <p className="mt-1">
                <Badge variant="outline" className="text-base">
                  {transformEnumValue(data.attributeType)}
                </Badge>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Required</label>
              <p className="mt-1">
                {data.isRequired ? (
                  <Badge variant="destructive">Required</Badge>
                ) : (
                  <Badge variant="secondary">Optional</Badge>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Sort Order</label>
              <p className="mt-1 text-base">{data.sortOrder}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">System Config</label>
              <p className="mt-1 text-base">
                {data.systemConfig?.id ? (
                  <Link
                    href={`/system-configs/${data.systemConfig.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {data.systemConfig.configKey}
                  </Link>
                ) : (
                  '-'
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1 text-base">
                <Badge
                  variant={data.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {transformEnumValue(data.status)}
                </Badge>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created By</label>
              <p className="mt-1 text-base">{data.createdBy || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created Date</label>
              <p className="mt-1 text-base">
                {data.createdDate ? new Date(data.createdDate).toLocaleString() : '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Last Modified By</label>
              <p className="mt-1 text-base">{data.lastModifiedBy || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Last Modified Date</label>
              <p className="mt-1 text-base">
                {data.lastModifiedDate
                  ? new Date(data.lastModifiedDate).toLocaleString()
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {isEnumType && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Attribute Options</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available options for this ENUM attribute
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/system-config-attribute-options/new?attributeId=${id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Link>
                </Button>
              </div>
            </div>

            <div className="p-6">
              {isLoadingOptions ? (
                <div className="text-center py-8 text-muted-foreground">Loading options...</div>
              ) : !options || options.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    No options configured for this attribute yet.
                  </div>
                  <div className="text-sm text-amber-600 mb-4">
                    ⚠️ ENUM attributes require at least one option to be used in product variants
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/system-config-attribute-options/new?attributeId=${id}`}>
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
                        <div className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{option.code}</code>
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
        )}

        {!isEnumType && (
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
                  This attribute type ({transformEnumValue(data.attributeType)}) does not use predefined options.
                  Values will be entered directly when creating product variants.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
