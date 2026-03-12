'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePermission } from '@/core/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import type { ProductDTO } from '@/core/api/generated/spring/schemas/ProductDTO';
import type { ProductVariantDTO } from '@/core/api/generated/spring/schemas/ProductVariantDTO';
import { getAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import { getAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { getWarehouses } from '@/app/(protected)/(features)/warehouses/actions/warehouse-api';
import type { IWarehouse } from '@/app/(protected)/(features)/warehouses/types/warehouse';

type InventoryViewMode = 'overall' | 'warehouse';
type ProductWithStockQuantity = ProductDTO & { stockQuantity?: number };
type ProductVariantWithStocks = ProductVariantDTO & {
  product?: {
    id?: number;
    name?: string;
  } | null;
  variantStocks?: Array<{
    id?: number;
    stockQuantity?: number;
    warehouse?: {
      id?: number;
      name?: string;
      code?: string;
    } | null;
  }>;
};

const INVENTORY_REPORT_PAGE_SIZE = 500;
const INVENTORY_REPORT_MAX_PAGES = 2000;

const normalizeStatus = (status?: string) => {
  if (!status || typeof status !== 'string') {
    return 'Unknown';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const fetchAllProductsForInventory = async (): Promise<ProductWithStockQuantity[]> => {
  const allProducts: ProductWithStockQuantity[] = [];

  for (let page = 0; page < INVENTORY_REPORT_MAX_PAGES; page++) {
    const batch = await getAllProducts({
      page,
      size: INVENTORY_REPORT_PAGE_SIZE,
      sort: ['name,asc'],
    });

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    allProducts.push(...(batch as ProductWithStockQuantity[]));

    if (batch.length < INVENTORY_REPORT_PAGE_SIZE) {
      break;
    }
  }

  return allProducts;
};

const fetchAllVariantsForInventory = async (): Promise<ProductVariantWithStocks[]> => {
  const allVariants: ProductVariantWithStocks[] = [];

  for (let page = 0; page < INVENTORY_REPORT_MAX_PAGES; page++) {
    const batch = await getAllProductVariants({
      page,
      size: INVENTORY_REPORT_PAGE_SIZE,
      sort: ['id,asc'],
    });

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    allVariants.push(...(batch as ProductVariantWithStocks[]));

    if (batch.length < INVENTORY_REPORT_PAGE_SIZE) {
      break;
    }
  }

  return allVariants;
};

const fetchAllWarehousesForInventory = async (): Promise<IWarehouse[]> => {
  const allWarehouses: IWarehouse[] = [];

  for (let page = 0; page < INVENTORY_REPORT_MAX_PAGES; page++) {
    const batch = await getWarehouses({
      page,
      size: INVENTORY_REPORT_PAGE_SIZE,
      sort: ['name,asc'],
    });

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    allWarehouses.push(...batch);

    if (batch.length < INVENTORY_REPORT_PAGE_SIZE) {
      break;
    }
  }

  return allWarehouses;
};

export function InventoryReportPanel() {
  const canReadProducts = usePermission('product:read');
  const [viewMode, setViewMode] = useState<InventoryViewMode>('overall');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: products = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
  } = useQuery({
    queryKey: ['dashboard', 'inventory-report', 'products'],
    queryFn: fetchAllProductsForInventory,
    staleTime: 60_000,
  });

  const {
    data: variants = [],
    isLoading: isVariantsLoading,
    isError: isVariantsError,
    error: variantsError,
  } = useQuery({
    queryKey: ['dashboard', 'inventory-report', 'variants'],
    queryFn: fetchAllVariantsForInventory,
    staleTime: 60_000,
  });

  const {
    data: warehouses = [],
    isLoading: isWarehousesLoading,
    isError: isWarehousesError,
    error: warehousesError,
  } = useQuery({
    queryKey: ['dashboard', 'inventory-report', 'warehouses'],
    queryFn: fetchAllWarehousesForInventory,
    staleTime: 60_000,
    enabled: viewMode === 'warehouse',
  });

  const isLoading =
    isProductsLoading || isVariantsLoading || (viewMode === 'warehouse' && isWarehousesLoading);
  const error = productsError || variantsError || warehousesError;
  const isError =
    isProductsError || isVariantsError || (viewMode === 'warehouse' && isWarehousesError);

  const variantsByProductId = useMemo(() => {
    const map = new Map<number, ProductVariantWithStocks[]>();

    variants.forEach((variant) => {
      const productId = variant.product?.id;

      if (typeof productId !== 'number') {
        return;
      }

      const existing = map.get(productId) ?? [];

      existing.push(variant);
      map.set(productId, existing);
    });

    return map;
  }, [variants]);

  const overallRows = useMemo(() => {
    return [...products]
      .map((product) => {
        const productId = product.id;
        const relatedVariants =
          typeof productId === 'number' ? (variantsByProductId.get(productId) ?? []) : [];
        const fallbackStock = relatedVariants.reduce(
          (sum, variant) => sum + (Number(variant.stockQuantity) || 0),
          0
        );
        const stockQuantity =
          typeof product.stockQuantity === 'number' ? product.stockQuantity : fallbackStock;

        return {
          productId: product.id ?? null,
          productName: product.name ?? 'Unnamed Product',
          barcodeText: product.barcodeText ?? '',
          category: product.category?.name ?? '—',
          status: normalizeStatus(product.status ?? ''),
          stockQuantity,
        };
      })
      .sort(
        (a, b) => b.stockQuantity - a.stockQuantity || a.productName.localeCompare(b.productName)
      );
  }, [products, variantsByProductId]);

  const warehouseRows = useMemo(() => {
    const warehouseById = new Map<number, IWarehouse>();

    warehouses.forEach((warehouse) => {
      if (typeof warehouse.id === 'number') {
        warehouseById.set(warehouse.id, warehouse);
      }
    });

    const productById = new Map<number, ProductWithStockQuantity>();

    products.forEach((product) => {
      if (typeof product.id === 'number') {
        productById.set(product.id, product);
      }
    });

    const groupedRows = new Map<
      string,
      {
        productId: number;
        productName: string;
        warehouseId: string;
        warehouseName: string;
        warehouseCode: string;
        stockQuantity: number;
      }
    >();

    const addGroupedRow = (
      productId: number,
      productName: string,
      warehouseId: string,
      warehouseName: string,
      warehouseCode: string,
      stockQuantity: number
    ) => {
      const key = `${productId}::${warehouseId}`;
      const existing = groupedRows.get(key);

      if (existing) {
        existing.stockQuantity += stockQuantity;

        return;
      }

      groupedRows.set(key, {
        productId,
        productName,
        warehouseId,
        warehouseName,
        warehouseCode,
        stockQuantity,
      });
    };

    variants.forEach((variant) => {
      const productId = variant.product?.id;

      if (typeof productId !== 'number') {
        return;
      }

      const product = productById.get(productId);

      if (!product) {
        return;
      }

      const variantStocks = Array.isArray(variant.variantStocks) ? variant.variantStocks : [];

      if (variantStocks.length > 0) {
        variantStocks.forEach((variantStock) => {
          const warehouseId = variantStock.warehouse?.id;
          const stockQuantity = Number(variantStock.stockQuantity) || 0;

          if (stockQuantity === 0) {
            return;
          }

          if (typeof warehouseId === 'number') {
            const warehouseDetails = warehouseById.get(warehouseId);

            addGroupedRow(
              productId,
              product.name ?? 'Unnamed Product',
              String(warehouseId),
              variantStock.warehouse?.name ?? warehouseDetails?.name ?? `Warehouse ${warehouseId}`,
              variantStock.warehouse?.code ?? warehouseDetails?.code ?? '—',
              stockQuantity
            );

            return;
          }

          addGroupedRow(
            productId,
            product.name ?? 'Unnamed Product',
            'N/A',
            'Unassigned Warehouse',
            '—',
            stockQuantity
          );
        });

        return;
      }

      const fallbackStock = Number(variant.stockQuantity) || 0;

      if (fallbackStock > 0) {
        addGroupedRow(
          productId,
          product.name ?? 'Unnamed Product',
          'N/A',
          'Unassigned Warehouse',
          '—',
          fallbackStock
        );
      }
    });

    return [...groupedRows.values()].sort(
      (a, b) => b.stockQuantity - a.stockQuantity || a.productName.localeCompare(b.productName)
    );
  }, [products, variants, warehouses]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredOverallRows = useMemo(() => {
    if (!normalizedSearchTerm) {
      return overallRows;
    }

    return overallRows.filter((row) =>
      [row.productName, row.barcodeText, row.category, row.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm)
    );
  }, [normalizedSearchTerm, overallRows]);

  const filteredWarehouseRows = useMemo(() => {
    if (!normalizedSearchTerm) {
      return warehouseRows;
    }

    return warehouseRows.filter((row) =>
      [row.productName, row.warehouseName, row.warehouseCode]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm)
    );
  }, [normalizedSearchTerm, warehouseRows]);

  if (!canReadProducts) {
    return null;
  }

  const totalOverallStock = filteredOverallRows.reduce((sum, row) => sum + row.stockQuantity, 0);
  const totalWarehouseStock = filteredWarehouseRows.reduce(
    (sum, row) => sum + row.stockQuantity,
    0
  );

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Inventory Report</CardTitle>
            <CardDescription>
              Switch between product-level and warehouse-level inventory insights.
            </CardDescription>
          </div>

          <div className="w-full sm:w-auto">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as InventoryViewMode)}
            >
              <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
                <TabsTrigger value="overall">All Over Inventory</TabsTrigger>
                <TabsTrigger value="warehouse">Inventory as Per Warehouse</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="relative mt-2 w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={
              viewMode === 'overall'
                ? 'Search products, barcode, category...'
                : 'Search product, warehouse, code...'
            }
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading inventory report...</span>
          </div>
        ) : isError ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load inventory report'}
          </div>
        ) : viewMode === 'overall' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{filteredOverallRows.length} products</Badge>
              <Badge variant="outline">Total stock: {totalOverallStock}</Badge>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOverallRows.length > 0 ? (
                      filteredOverallRows.map((row) => (
                        <TableRow key={row.productId ?? row.productName}>
                          <TableCell className="font-medium">{row.productName}</TableCell>
                          <TableCell>{row.barcodeText || '—'}</TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {row.stockQuantity}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No inventory rows match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{filteredWarehouseRows.length} warehouse rows</Badge>
              <Badge variant="outline">Total stock: {totalWarehouseStock}</Badge>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Warehouse Code</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarehouseRows.length > 0 ? (
                      filteredWarehouseRows.map((row) => (
                        <TableRow key={`${row.productId}-${row.warehouseId}`}>
                          <TableCell className="font-medium">{row.productName}</TableCell>
                          <TableCell>{row.warehouseName}</TableCell>
                          <TableCell>{row.warehouseCode}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {row.stockQuantity}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No warehouse inventory rows match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
