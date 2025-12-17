'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetSystemConfigAttributeOption } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';

interface SystemConfigAttributeOptionDetailsProps {
  id: number;
}

function transformEnumValue(enumValue?: string | null): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue as any;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function NotSet({ fallback = 'Not set' }: { fallback?: string }) {
  return <span className="text-muted-foreground italic">{fallback}</span>;
}

function formatDate(value?: string | null) {
  return value ? format(new Date(value), 'PPP') : <NotSet />;
}

export function SystemConfigAttributeOptionDetails({ id }: SystemConfigAttributeOptionDetailsProps) {
  const { data: entity, isLoading } = useGetSystemConfigAttributeOption(id, {
    query: {
      enabled: !!id,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Entity not found</div>
      </div>
    );
  }

  const steps = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Core option information',
      fields: [
        { label: 'ID', value: entity.id ?? <NotSet /> },
        { label: 'Code', value: entity.code || <NotSet /> },
        { label: 'Label', value: entity.label || <NotSet /> },
        { label: 'Sort Order', value: entity.sortOrder ?? <NotSet /> },
        {
          label: 'Status',
          value: entity.status ? (
            <Badge variant={entity.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
              {transformEnumValue(entity.status)}
            </Badge>
          ) : (
            <NotSet />
          ),
        },
      ],
    },
    {
      id: 'attribute',
      title: 'Attribute',
      description: 'The attribute this option belongs to',
      fields: [
        {
          label: 'Attribute',
          value: entity.attribute?.id ? (
            <Link href={`/system-config-attributes/${entity.attribute.id}`} className="text-blue-600 hover:underline">
              {entity.attribute.label || entity.attribute.name}
            </Link>
          ) : (
            <NotSet fallback="Not linked" />
          ),
        },
        { label: 'Attribute Name', value: entity.attribute?.name || <NotSet /> },
        { label: 'Attribute Label', value: entity.attribute?.label || <NotSet /> },
      ],
    },
    {
      id: 'audit',
      title: 'Audit',
      description: 'Created and last modified metadata',
      fields: [
        { label: 'Created By', value: entity.createdBy || <NotSet /> },
        { label: 'Created Date', value: formatDate(entity.createdDate) },
        { label: 'Last Modified By', value: entity.lastModifiedBy || <NotSet /> },
        { label: 'Last Modified Date', value: formatDate(entity.lastModifiedDate) },
      ],
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                Step {index + 1} of {steps.length}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {step.fields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{field.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/system-config-attribute-options/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

