'use client';

import { useGetSystemConfigAttributeOption } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
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

export default function SystemConfigAttributeOptionDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, error } = useGetSystemConfigAttributeOption(parseInt(id));

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-500">Error loading attribute option</div>;
  }

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:read"
      unauthorizedTitle="Access Denied to View Attribute Option"
      unauthorizedDescription="You don't have permission to view attribute option details."
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
                <h1 className="text-2xl font-bold">Attribute Option Details</h1>
                <p className="text-blue-100">View option details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/system-config-attribute-options">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Link href={`/system-config-attribute-options/${id}/edit`}>
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
              <label className="text-sm font-medium text-gray-500">Code</label>
              <p className="mt-1 text-base font-semibold">{data.code}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Label</label>
              <p className="mt-1 text-base">{data.label}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Sort Order</label>
              <p className="mt-1 text-base">{data.sortOrder}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Attribute</label>
              <p className="mt-1 text-base">{data.attribute?.name || '-'} ({data.attribute?.label || '-'})</p>
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
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {transformEnumValue(data.status)}
                </span>
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
      </div>
    </PermissionGuard>
  );
}
