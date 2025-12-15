'use client';

import { useGetSystemConfig } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
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

export default function SystemConfigDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, error } = useGetSystemConfig(parseInt(id));
  const { data: attributes, isLoading: isLoadingAttributes } = useGetAllSystemConfigAttributes({
    'systemConfigId.equals': parseInt(id),
    size: 1000,
    sort: ['sortOrder,asc'],
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-500">Error loading system config</div>;
  }

  return (
    <PermissionGuard
      requiredPermission="systemConfig:read"
      unauthorizedTitle="Access Denied to View System Config"
      unauthorizedDescription="You don't have permission to view system config details."
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
                <h1 className="text-2xl font-bold">System Config Details</h1>
                <p className="text-blue-100">View configuration details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/system-configs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Link href={`/system-configs/${id}/edit`}>
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
              <label className="text-sm font-medium text-gray-500">Config Key</label>
              <p className="mt-1 text-base font-semibold">{data.configKey}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Config Type</label>
              <p className="mt-1 text-base">{transformEnumValue(data.systemConfigType)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1 text-base">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    data.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : data.status === 'INACTIVE'
                        ? 'bg-gray-100 text-gray-800'
                        : data.status === 'ARCHIVED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {transformEnumValue(data.status)}
                </span>
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-base">{data.description || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created By</label>
              <p className="mt-1 text-base">{data.createdBy || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Created Date</label>
              <p className="mt-1 text-base">
                {data.createdDate
                  ? new Date(data.createdDate).toLocaleString()
                  : '-'}
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

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Attributes</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Attributes defined for this system config
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/system-config-attributes/new?systemConfigId=${id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-6">
            {isLoadingAttributes ? (
              <div className="text-center py-8 text-muted-foreground">Loading attributes...</div>
            ) : !attributes || attributes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  No attributes configured for this system config yet.
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/system-config-attributes/new?systemConfigId=${id}`}>
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
                      <div className="flex items-center gap-3">
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
                        Name: <code className="px-1 py-0.5 bg-gray-100 rounded">{attr.name}</code>
                        {attr.attributeType === 'ENUM' && (
                          <span className="ml-2 text-blue-600">
                            → Configure options in System Config Attribute Options
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/system-config-attributes/${attr.id}`}>
                          View
                        </Link>
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
      </div>
    </PermissionGuard>
  );
}
