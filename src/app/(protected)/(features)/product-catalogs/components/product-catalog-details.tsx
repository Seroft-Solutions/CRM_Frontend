'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, Pencil } from 'lucide-react';
import { handleProductCatalogError, productCatalogToast } from './product-catalog-toast';
import { productCatalogFormConfig } from './form/product-catalog-form-config';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';
import { ProductVariantManagerWrapper } from '@/app/(protected)/(features)/products/components/variants/ProductVariantManagerWrapper';
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
  useDeleteProductCatalog,
  useGetProductCatalog,
} from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';

interface ProductCatalogDetailsProps {
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

export function ProductCatalogDetails({ id }: ProductCatalogDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formConfig = productCatalogFormConfig;

  const { data: entity, isLoading } = useGetProductCatalog(id, {
    query: {
      enabled: !!id,
    },
  });

  const productId = entity?.product?.id;
  const shouldFetchProduct = typeof productId === 'number' && !entity?.product?.variantConfig?.id;
  const { data: productDetails, isLoading: isLoadingProductDetails } = useGetProduct(
    productId || 0,
    {
      query: {
        enabled: shouldFetchProduct,
      },
    }
  );

  const catalogVariantIds = useMemo(
    () =>
      (entity?.variants || [])
        .map((variant) => variant.id)
        .filter((variantId): variantId is number => typeof variantId === 'number'),
    [entity?.variants]
  );

  const variantConfigId = entity?.product?.variantConfig?.id ?? productDetails?.variantConfig?.id;
  const productName = entity?.product?.name || entity?.productCatalogName || 'Product';
  const hasCatalogVariants = typeof productId === 'number' && catalogVariantIds.length > 0;
  const canRenderVariantsTable = hasCatalogVariants && typeof variantConfigId === 'number';

  const { mutate: deleteEntity } = useDeleteProductCatalog({
    mutation: {
      onSuccess: () => {
        productCatalogToast.deleted();
        router.push('/product-catalogs');
      },
      onError: (error) => {
        handleProductCatalogError(error);
      },
    },
  });

  const handleDelete = () => {
    deleteEntity({ id });
    setShowDeleteDialog(false);
  };

  const renderFieldValue = (fieldConfig: any, value: any) => {
    if (fieldConfig.name === 'image') {
      const imageUrl = resolveCatalogImageUrl(String(value || ''));
      return imageUrl ? (
        <img
          src={imageUrl}
          alt="Catalog image"
          className="h-16 w-16 rounded border object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-muted-foreground italic">Not set</span>
      );
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

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {displaySteps.length + 1}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Variants</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Product variants linked to this catalog
              </p>
            </div>
          </div>

          {!hasCatalogVariants ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No variants are linked to this catalog.
            </div>
          ) : !canRenderVariantsTable ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              {isLoadingProductDetails ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading variant configuration...</span>
                </div>
              ) : (
                'Variant configuration is unavailable for this product.'
              )}
            </div>
          ) : (
            <ProductVariantManagerWrapper
              productId={productId}
              productName={productName}
              variantConfigId={variantConfigId}
              variantIdsFilter={catalogVariantIds}
              isViewMode={true}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" asChild className="flex items-center gap-2 justify-center">
            <Link href={`/product-catalogs/${id}/edit`}>
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
              This action cannot be undone. This will permanently delete the product catalog and
              remove its data from the server.
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
