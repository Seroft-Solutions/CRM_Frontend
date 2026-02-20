'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetProduct } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { useGetAllProductCatalogs } from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { ProductBasicInfoSection } from './form/sections/ProductBasicInfoSection';
import { ProductClassificationSection } from './form/sections/ProductClassificationSection';

interface ProductViewFormProps {
  id: number;
}

function ProductViewSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <Card key={index} className="border shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-8 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProductViewForm({ id }: ProductViewFormProps) {
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProduct(id, { query: { enabled: Number.isFinite(id) } });
  const { data: productCatalogs = [], isLoading: isLoadingProductCatalogs } =
    useGetAllProductCatalogs(
      {
        'productId.equals': id,
        size: 1000,
        sort: ['productCatalogName,asc'],
      },
      { query: { enabled: Number.isFinite(id) } }
    );

  if (isLoading) {
    return <ProductViewSkeleton />;
  }

  if (error || !product) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="text-sm font-semibold text-red-700">Unable to load product</div>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-sm text-red-700 space-y-3">
          <p>
            {error instanceof Error
              ? error.message
              : 'We could not retrieve the product details. Please try again.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Basic Information Section */}
      <ProductBasicInfoSection isViewMode={true} product={product} />

      {/* Classification Section */}
      <ProductClassificationSection isViewMode={true} product={product} productId={id} />
      <Card className="border shadow-sm">
        <CardHeader className="pb-2 pt-3 px-4">
          <h3 className="text-sm font-semibold text-slate-800">Catalogs</h3>
          <p className="text-[11px] text-muted-foreground">
            Catalog entries created for this product
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoadingProductCatalogs ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-8 w-48" />
            </div>
          ) : productCatalogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No catalog entries found for this product.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {productCatalogs
                .filter((catalog) => typeof catalog.id === 'number')
                .map((catalog) => (
                  <Link
                    key={catalog.id}
                    href={`/product-catalogs/${catalog.id}`}
                    className="inline-flex items-center rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 hover:underline"
                  >
                    {catalog.productCatalogName}
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
