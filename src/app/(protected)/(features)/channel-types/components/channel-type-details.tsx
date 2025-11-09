'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react';
import { channelTypeToast, handleChannelTypeError } from './channel-type-toast';
import { channelTypeFormConfig } from './form/channel-type-form-config';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  useDeleteChannelType,
  useGetChannelType,
} from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';

interface ChannelTypeDetailsProps {
  id: number;
}

function RelationshipDisplayValue({ value, relConfig }: { value: any; relConfig: any }) {
  if (!value) {
    return (
      <span className="text-muted-foreground italic">
        {relConfig.multiple ? 'None selected' : 'Not selected'}
      </span>
    );
  }

  let allData = null;

  if (!allData) {
    if (relConfig.multiple && Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">None selected</span>;
      }
      const displayValues = value.map(
        (item: any) => item[relConfig.displayField] || item.id || item
      );
      return <span>{displayValues.join(', ')}</span>;
    } else {
      const displayValue = value[relConfig.displayField] || value.id || value;
      return <span>{displayValue}</span>;
    }
  }

  const dataArray = Array.isArray(allData)
    ? allData
    : allData.content
      ? allData.content
      : allData.data
        ? allData.data
        : [];

  if (relConfig.multiple && Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">None selected</span>;
    }

    const selectedItems = dataArray.filter((item: any) =>
      value.some((v: any) => {
        const valueId = typeof v === 'object' ? v[relConfig.primaryKey] : v;
        return item[relConfig.primaryKey] === valueId;
      })
    );

    if (selectedItems.length === 0) {
      return <span className="text-muted-foreground italic">{value.length} selected</span>;
    }

    const displayValues = selectedItems.map((item: any) => item[relConfig.displayField]);
    return <span>{displayValues.join(', ')}</span>;
  } else {
    const valueId = typeof value === 'object' ? value[relConfig.primaryKey] : value;
    const selectedItem = dataArray.find((item: any) => item[relConfig.primaryKey] === valueId);

    return selectedItem ? (
      <span>{selectedItem[relConfig.displayField]}</span>
    ) : (
      <span className="text-muted-foreground italic">Selected (ID: {valueId})</span>
    );
  }
}

export function ChannelTypeDetails({ id }: ChannelTypeDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formConfig = channelTypeFormConfig;

  const { data: entity, isLoading } = useGetChannelType(id, {
    query: {
      enabled: !!id,
    },
  });

  const { mutate: deleteEntity } = useDeleteChannelType({
    mutation: {
      onSuccess: () => {
        channelTypeToast.deleted();
        router.push('/channel-types');
      },
      onError: (error) => {
        handleChannelTypeError(error);
      },
    },
  });

  const handleDelete = () => {
    deleteEntity({ id });
    setShowDeleteDialog(false);
  };

  const renderFieldValue = (fieldConfig: any, value: any) => {
    if (fieldConfig.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (fieldConfig.type === 'date') {
      return value ? (
        format(new Date(value), 'PPP')
      ) : (
        <span className="text-muted-foreground italic">Not set</span>
      );
    }

    if (fieldConfig.type === 'file') {
      return value ? (
        'File uploaded'
      ) : (
        <span className="text-muted-foreground italic">No file</span>
      );
    }

    if (fieldConfig.type === 'enum') {
      return value || <span className="text-muted-foreground italic">Not set</span>;
    }

    return value || <span className="text-muted-foreground italic">Not set</span>;
  };

  const renderRelationshipValue = (relConfig: any, value: any) => {
    return <RelationshipDisplayValue value={value} relConfig={relConfig} />;
  };

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

  const displaySteps = formConfig.steps.filter(
    (step) => step.id !== 'review' && (step.fields.length > 0 || step.relationships.length > 0)
  );

  return (
    <>
      <div className="space-y-6">
        {displaySteps.map((step, index) => {
          const stepFields = [...step.fields, ...step.relationships];
          if (stepFields.length === 0) return null;

          return (
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
                  Step {index + 1} of {displaySteps.length}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Render Fields */}
                {step.fields.map((fieldName) => {
                  const fieldConfig = formConfig.fields.find((f) => f.name === fieldName);
                  if (!fieldConfig) return null;

                  const value = entity[fieldName];

                  return (
                    <div key={fieldName} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {fieldConfig.label}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {renderFieldValue(fieldConfig, value)}
                      </div>
                    </div>
                  );
                })}

                {/* Render Relationships */}
                {step.relationships.map((relationshipName) => {
                  const relConfig = formConfig.relationships.find(
                    (r) => r.name === relationshipName
                  );
                  if (!relConfig) return null;

                  const value = entity[relationshipName];

                  return (
                    <div key={relationshipName} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {relConfig.ui.label}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {renderRelationshipValue(relConfig, value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/channel-types/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the channeltype and remove
              its data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
