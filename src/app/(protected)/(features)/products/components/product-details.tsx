'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Camera, Pencil } from 'lucide-react';
import { handleProductError, productToast } from './product-toast';
import { productFormConfig } from './form/product-form-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  useDeleteProduct,
  useGetProduct,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas/ProductImageDTO';
import {
  ORIENTATION_FIELDS,
  mapImagesByOrientation,
} from '@/features/product-images/utils/orientation';

import { useGetAllProductCategories } from '@/core/api/generated/spring/endpoints/product-category-resource/product-category-resource.gen';
import { useGetAllProductSubCategories } from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

interface ProductDetailsProps {
  id: number;
}


function RelationshipDisplayValue({ value, relConfig }: { value: any; relConfig: any }) {
  const { data: categoryData } =
    relConfig.name === 'category'
      ? useGetAllProductCategories(
          { page: 0, size: 1000 },
          {
            query: {
              enabled: !!value && relConfig.name === 'category',
              staleTime: 5 * 60 * 1000,
            },
          }
        )
      : { data: null };
  const { data: subCategoryData } =
    relConfig.name === 'subCategory'
      ? useGetAllProductSubCategories(
          { page: 0, size: 1000 },
          {
            query: {
              enabled: !!value && relConfig.name === 'subCategory',
              staleTime: 5 * 60 * 1000,
            },
          }
        )
      : { data: null };
  const { data: systemConfigData } =
    relConfig.name === 'variantConfig'
      ? useGetAllSystemConfigs(
          { page: 0, size: 1000 },
          {
            query: {
              enabled: !!value && relConfig.name === 'variantConfig',
              staleTime: 5 * 60 * 1000,
            },
          }
        )
      : { data: null };

  if (!value) {
    return (
      <span className="text-muted-foreground italic">
        {relConfig.multiple ? 'None selected' : 'Not selected'}
      </span>
    );
  }

  let allData = null;
  if (relConfig.name === 'category') {
    allData = categoryData;
  }
  if (relConfig.name === 'subCategory') {
    allData = subCategoryData;
  }
  if (relConfig.name === 'variantConfig') {
    allData = systemConfigData;
  }

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

export function ProductDetails({ id }: ProductDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formConfig = productFormConfig;

  const { data: entity, isLoading } = useGetProduct(id, {
    query: {
      enabled: !!id,
    },
  });

  const { mutate: deleteEntity } = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        productToast.deleted();
        router.push('/products');
      },
      onError: (error) => {
        handleProductError(error);
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

function OrientationPreviewCard({
  field,
  image,
}: {
  field: (typeof ORIENTATION_FIELDS)[number];
  image?: ProductImageDTO;
}) {
  const previewUrl = image?.thumbnailUrl || image?.cdnUrl;
  const helperText = image
    ? `${image.originalFilename ?? 'Uploaded image'}${
        image.fileSizeBytes ? ` • ${(image.fileSizeBytes / 1024).toFixed(1)} KB` : ''
      }`
    : 'No image uploaded';

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{field.label}</p>
          <p className="text-xs text-slate-500">{field.description}</p>
        </div>
        <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
          {field.badge}
        </Badge>
      </div>

      <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200">
        {previewUrl ? (
          <img src={previewUrl} alt={`${field.label} preview`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Camera className="h-10 w-10" />
            <span className="text-sm font-medium">No image uploaded</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p
          className="text-xs font-medium text-slate-600 truncate overflow-hidden whitespace-nowrap text-ellipsis block max-w-[240px] sm:max-w-[320px]"
          title={helperText}
        >
          {helperText}
        </p>
      </div>
    </div>
  );
}

  const renderRelationshipValue = (relConfig: any, value: any) => {
    return <RelationshipDisplayValue value={value} relConfig={relConfig} />;
  };

  const orientationImageMap = useMemo(() => {
    return mapImagesByOrientation(entity?.images);
  }, [entity?.images]);

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

  const displaySteps = formConfig.steps.filter((step) => step.id !== 'review');

  return (
    <>
      <div className="space-y-6">
        {displaySteps.map((step, index) => {
          const stepFields = [...step.fields, ...step.relationships];
          const isImagesStep = step.id === 'images';

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
              {isImagesStep ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ORIENTATION_FIELDS.map((field) => (
                    <OrientationPreviewCard
                      key={field.name}
                      field={field}
                      image={orientationImageMap[field.name]}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Render Fields */}
                {step.fields.map((fieldName) => {
                  const fieldConfig = formConfig.fields.find((f) => f.name === fieldName);
                  if (!fieldConfig) return null;

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
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/products/${id}/edit`}>
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
              This action cannot be undone. This will permanently delete the product and remove its
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
