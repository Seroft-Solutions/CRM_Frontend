'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react';
import { customerToast, handleCustomerError } from './customer-toast';
import { customerFormConfig } from './form/customer-form-config';
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
  useDeleteCustomer,
  useGetCustomer,
} from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';

interface CustomerDetailsProps {
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

  if (relConfig.name === 'area') {
    return <span className="text-muted-foreground italic">Deprecated: See Addresses Section</span>;
  }

  if (relConfig.multiple && Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">None selected</span>;
    }
    const displayValues = value.map((item: any) => item[relConfig.displayField] || item.id || item);
    return <span>{displayValues.join(', ')}</span>;
  } else {
    const displayValue = value[relConfig.displayField] || value.id || value;
    return <span>{displayValue}</span>;
  }
}

export function CustomerDetails({ id }: CustomerDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formConfig = customerFormConfig;

  const { data: entity, isLoading } = useGetCustomer(id, {
    query: {
      enabled: !!id,
    },
  });

  const { mutate: deleteEntity } = useDeleteCustomer({
    mutation: {
      onSuccess: () => {
        customerToast.deleted();
        router.push('/customers');
      },
      onError: (error) => {
        handleCustomerError(error);
      },
    },
  });

  const handleDelete = () => {
    deleteEntity({ id });
    setShowDeleteDialog(false);
  };

  const renderFieldValue = (fieldConfig: any, value: any) => {
    if (fieldConfig.type === 'custom') {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

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

    if (value && typeof value === 'object') {
      return Array.isArray(value) ? `${value.length} item(s)` : JSON.stringify(value);
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
                  if (!fieldConfig || fieldConfig.type === 'custom') return null;

                  const value = (entity as any)[fieldName];

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

                  const value = (entity as any)[relationshipName];

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

        {/* Addresses Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Addresses</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Manage and view customer delivery locations</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {((entity as any).addresses || []).length > 0 ? (
              (entity as any).addresses.map((address: any, idx: number) => (
                <div key={address.id || idx} className={`p-3 rounded-md border ${address.isDefault ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Address {idx + 1}</span>
                    {address.isDefault && (
                      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">{address.completeAddress}</p>
                  <p className="text-xs text-slate-600">
                    {address.area ? [
                      (address.area as any).city?.name || (address.area as any).cityName,
                      (address.area as any).city?.district?.state?.name || (address.area as any).stateName,
                      address.area.pincode
                    ].filter(Boolean).join(', ') : [address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-4 text-center text-sm text-muted-foreground italic bg-slate-50 rounded-md border border-dashed border-slate-300">
                No addresses recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/customers/${id}/edit`}>
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
              This action cannot be undone. This will permanently delete the customer and remove its
              data from the server.
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
