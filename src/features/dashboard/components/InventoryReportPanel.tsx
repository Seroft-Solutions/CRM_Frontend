'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRBAC } from '@/core/auth';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
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
import { FileDown, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
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

type OverallInventoryRow = {
  productId: number | null;
  productName: string;
  barcodeText: string;
  category: string;
  status: string;
  stockQuantity: number;
};

type WarehouseInventoryRow = {
  productId: number | null;
  productName: string;
  variantSku: string;
  variantDetails: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  stockQuantity: number;
};

const INVENTORY_REPORT_PAGE_SIZE = 500;
const INVENTORY_REPORT_MAX_PAGES = 2000;
const numberFormatter = new Intl.NumberFormat('en-US');

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

const formatStockNumber = (value: number) => numberFormatter.format(value);

const getVariantDetails = (variant: ProductVariantWithStocks): string => {
  const selectionLabels = (variant.selections || [])
    .map((selection) => {
      const attributeLabel = selection.attribute?.label || selection.attribute?.name || 'Attribute';
      const optionLabel = selection.option?.label || selection.rawValue || selection.option?.code;

      if (!optionLabel) {
        return null;
      }

      return `${attributeLabel}: ${optionLabel}`;
    })
    .filter((label): label is string => Boolean(label));

  if (selectionLabels.length > 0) {
    return selectionLabels.join(' | ');
  }

  return 'Standard Variant';
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
  const { isAdmin, hasPermission, isLoading: isAuthoritiesLoading } = useRBAC();
  const canAccessInventoryReport =
    isAdmin() || hasPermission('dashboard') || hasPermission('product:read');
  const [viewMode, setViewMode] = useState<InventoryViewMode>('overall');
  const [searchTerm, setSearchTerm] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const {
    data: products = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
  } = useQuery({
    queryKey: ['dashboard', 'inventory-report', 'products'],
    queryFn: fetchAllProductsForInventory,
    staleTime: 60_000,
    enabled: canAccessInventoryReport,
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
    enabled: canAccessInventoryReport,
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
    enabled: canAccessInventoryReport && viewMode === 'warehouse',
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

  const overallRows = useMemo<OverallInventoryRow[]>(() => {
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
          category: product.category?.name ?? 'N/A',
          status: normalizeStatus(product.status ?? ''),
          stockQuantity,
        };
      })
      .sort(
        (a, b) => b.stockQuantity - a.stockQuantity || a.productName.localeCompare(b.productName)
      );
  }, [products, variantsByProductId]);

  const warehouseRows = useMemo<WarehouseInventoryRow[]>(() => {
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

    const variantProductIds = new Set<number>();
    const detailedRows = new Map<string, WarehouseInventoryRow>();

    const addDetailedRow = (row: WarehouseInventoryRow, variantIdentifier: string) => {
      const key = `${row.productId || 'N/A'}::${variantIdentifier}::${row.warehouseId}`;
      const existing = detailedRows.get(key);

      if (existing) {
        existing.stockQuantity += row.stockQuantity;

        return;
      }

      detailedRows.set(key, row);
    };

    variants.forEach((variant) => {
      const productId = variant.product?.id;

      if (typeof productId !== 'number') {
        return;
      }

      variantProductIds.add(productId);

      const product = productById.get(productId);
      const productName = variant.product?.name || product?.name || 'Unnamed Product';
      const variantIdentifier =
        typeof variant.id === 'number' ? `variant-${variant.id}` : `sku-${variant.sku || 'N/A'}`;
      const variantSku = variant.sku || 'N/A';
      const variantDetails = getVariantDetails(variant);
      const variantStocks = Array.isArray(variant.variantStocks) ? variant.variantStocks : [];

      if (variantStocks.length > 0) {
        variantStocks.forEach((variantStock) => {
          const stockQuantity = Number(variantStock.stockQuantity) || 0;

          if (stockQuantity === 0) {
            return;
          }

          const warehouseId = variantStock.warehouse?.id;

          if (typeof warehouseId === 'number') {
            const warehouseDetails = warehouseById.get(warehouseId);

            addDetailedRow(
              {
                productId,
                productName,
                variantSku,
                variantDetails,
                warehouseId: String(warehouseId),
                warehouseName:
                  variantStock.warehouse?.name ||
                  warehouseDetails?.name ||
                  `Warehouse ${warehouseId}`,
                warehouseCode: variantStock.warehouse?.code || warehouseDetails?.code || 'N/A',
                stockQuantity,
              },
              variantIdentifier
            );

            return;
          }

          addDetailedRow(
            {
              productId,
              productName,
              variantSku,
              variantDetails,
              warehouseId: 'N/A',
              warehouseName: 'Unassigned Warehouse',
              warehouseCode: 'N/A',
              stockQuantity,
            },
            variantIdentifier
          );
        });

        return;
      }

      const fallbackStock = Number(variant.stockQuantity) || 0;

      if (fallbackStock > 0) {
        addDetailedRow(
          {
            productId,
            productName,
            variantSku,
            variantDetails,
            warehouseId: 'N/A',
            warehouseName: 'Unassigned Warehouse',
            warehouseCode: 'N/A',
            stockQuantity: fallbackStock,
          },
          variantIdentifier
        );
      }
    });

    products.forEach((product) => {
      if (typeof product.id !== 'number' || variantProductIds.has(product.id)) {
        return;
      }

      const stockQuantity = Number(product.stockQuantity) || 0;

      if (stockQuantity === 0) {
        return;
      }

      addDetailedRow(
        {
          productId: product.id,
          productName: product.name ?? 'Unnamed Product',
          variantSku: 'N/A',
          variantDetails: 'No Variant Details',
          warehouseId: 'N/A',
          warehouseName: 'Unassigned Warehouse',
          warehouseCode: 'N/A',
          stockQuantity,
        },
        'no-variant'
      );
    });

    return [...detailedRows.values()].sort((a, b) => {
      if (b.stockQuantity !== a.stockQuantity) {
        return b.stockQuantity - a.stockQuantity;
      }

      const byProduct = a.productName.localeCompare(b.productName);

      if (byProduct !== 0) {
        return byProduct;
      }

      return a.variantSku.localeCompare(b.variantSku);
    });
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
      [row.productName, row.variantSku, row.variantDetails, row.warehouseName, row.warehouseCode]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm)
    );
  }, [normalizedSearchTerm, warehouseRows]);

  const totalOverallStock = filteredOverallRows.reduce((sum, row) => sum + row.stockQuantity, 0);
  const totalWarehouseStock = filteredWarehouseRows.reduce(
    (sum, row) => sum + row.stockQuantity,
    0
  );
  const totalStockForMode = viewMode === 'overall' ? totalOverallStock : totalWarehouseStock;
  const reportModeLabel =
    viewMode === 'overall' ? 'All Over Inventory' : 'Inventory as Per Warehouse (Detailed)';
  const reportRowsCount =
    viewMode === 'overall' ? filteredOverallRows.length : filteredWarehouseRows.length;
  const reportGeneratedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const canGenerateReport =
    !isLoading &&
    !isError &&
    (viewMode === 'overall' ? filteredOverallRows.length > 0 : filteredWarehouseRows.length > 0);

  const handlePrintReport = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `inventory-report-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 16mm; }
      html, body { margin: 0 !important; padding: 0 !important; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `,
    onAfterPrint: () => {
      toast.success('Inventory report generated. Use Save as PDF in the print dialog.');
    },
    onPrintError: () => {
      toast.error('Failed to generate inventory PDF report.');
    },
  });

  const handleGeneratePdf = () => {
    if (!canGenerateReport) {
      toast.error('No inventory data available for report generation.');

      return;
    }

    handlePrintReport();
  };

  if (isAuthoritiesLoading) {
    return null;
  }

  if (!canAccessInventoryReport) {
    return null;
  }

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>
                Switch between product-level and warehouse-level inventory insights.
              </CardDescription>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2">
              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as InventoryViewMode)}
              >
                <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
                  <TabsTrigger value="overall">All Over Inventory</TabsTrigger>
                  <TabsTrigger value="warehouse">Inventory as Per Warehouse</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                type="button"
                onClick={handleGeneratePdf}
                disabled={!canGenerateReport}
                className="h-9 px-4 bg-slate-900 text-white hover:bg-slate-800"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Generate Inventory Report (PDF)
              </Button>
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
                  : 'Search product, variant, warehouse, code...'
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
                <Badge variant="outline">Total stock: {formatStockNumber(totalOverallStock)}</Badge>
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
                            <TableCell>{row.barcodeText || 'N/A'}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatStockNumber(row.stockQuantity)}
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
                <Badge variant="secondary">{filteredWarehouseRows.length} detailed rows</Badge>
                <Badge variant="outline">
                  Total stock: {formatStockNumber(totalWarehouseStock)}
                </Badge>
              </div>

              <div className="rounded-md border">
                <div className="max-h-[420px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Variant SKU</TableHead>
                        <TableHead>Variant Details</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Warehouse Code</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarehouseRows.length > 0 ? (
                        filteredWarehouseRows.map((row) => (
                          <TableRow
                            key={`${row.productId ?? 'N/A'}-${row.variantSku}-${row.warehouseId}-${row.variantDetails}`}
                          >
                            <TableCell className="font-medium">{row.productName}</TableCell>
                            <TableCell>{row.variantSku}</TableCell>
                            <TableCell>{row.variantDetails}</TableCell>
                            <TableCell>{row.warehouseName}</TableCell>
                            <TableCell>{row.warehouseCode}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatStockNumber(row.stockQuantity)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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

      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 0,
          width: '210mm',
          background: '#fff',
        }}
      >
        <div ref={reportRef}>
          <style>{`
            .inventory-print-page {
              color: #0f172a;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              overflow: hidden;
            }
            .inventory-print-header {
              padding: 20px 24px;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%);
              color: #fff;
            }
            .inventory-print-title {
              margin: 0;
              font-size: 24px;
              letter-spacing: 0.3px;
            }
            .inventory-print-subtitle {
              margin: 6px 0 0;
              color: #cbd5e1;
              font-size: 13px;
            }
            .inventory-print-meta {
              padding: 16px 24px;
              border-bottom: 1px solid #e2e8f0;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              background: #f8fafc;
            }
            .inventory-print-meta-card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              background: #fff;
              padding: 10px 12px;
            }
            .inventory-print-meta-label {
              display: block;
              margin-bottom: 4px;
              font-size: 11px;
              color: #64748b;
              letter-spacing: 0.3px;
              text-transform: uppercase;
            }
            .inventory-print-meta-value {
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
            }
            .inventory-print-table-wrap {
              padding: 18px 24px 24px;
            }
            .inventory-print-table {
              width: 100%;
              border-collapse: collapse;
            }
            .inventory-print-table th {
              background: #f1f5f9;
              border-bottom: 1px solid #cbd5e1;
              color: #0f172a;
              font-size: 12px;
              text-align: left;
              padding: 10px 10px;
            }
            .inventory-print-table td {
              border-bottom: 1px solid #e2e8f0;
              padding: 9px 10px;
              font-size: 12px;
              color: #0f172a;
              vertical-align: top;
            }
            .inventory-print-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .inventory-print-num {
              text-align: right;
              font-variant-numeric: tabular-nums;
            }
            .inventory-print-footer {
              padding: 10px 24px 18px;
              font-size: 11px;
              color: #64748b;
            }
          `}</style>

          <div className="inventory-print-page">
            <div className="inventory-print-header">
              <h1 className="inventory-print-title">Inventory Report</h1>
              <p className="inventory-print-subtitle">
                Professional stock summary generated from CRM dashboard.
              </p>
            </div>

            <div className="inventory-print-meta">
              <div className="inventory-print-meta-card">
                <span className="inventory-print-meta-label">Report Type</span>
                <span className="inventory-print-meta-value">{reportModeLabel}</span>
              </div>
              <div className="inventory-print-meta-card">
                <span className="inventory-print-meta-label">Rows</span>
                <span className="inventory-print-meta-value">{reportRowsCount}</span>
              </div>
              <div className="inventory-print-meta-card">
                <span className="inventory-print-meta-label">Total Stock</span>
                <span className="inventory-print-meta-value">
                  {formatStockNumber(totalStockForMode)}
                </span>
              </div>
            </div>

            <div className="inventory-print-table-wrap">
              <table className="inventory-print-table">
                <thead>
                  {viewMode === 'overall' ? (
                    <tr>
                      <th>Product</th>
                      <th>Barcode</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th className="inventory-print-num">Stock</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Product</th>
                      <th>Variant SKU</th>
                      <th>Variant Details</th>
                      <th>Warehouse</th>
                      <th>Warehouse Code</th>
                      <th className="inventory-print-num">Stock</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {viewMode === 'overall'
                    ? filteredOverallRows.map((row) => (
                        <tr key={`print-overall-${row.productId ?? row.productName}`}>
                          <td>{row.productName}</td>
                          <td>{row.barcodeText || 'N/A'}</td>
                          <td>{row.category}</td>
                          <td>{row.status}</td>
                          <td className="inventory-print-num">
                            {formatStockNumber(row.stockQuantity)}
                          </td>
                        </tr>
                      ))
                    : filteredWarehouseRows.map((row) => (
                        <tr
                          key={`print-warehouse-${row.productId ?? 'N/A'}-${row.variantSku}-${row.warehouseId}-${row.variantDetails}`}
                        >
                          <td>{row.productName}</td>
                          <td>{row.variantSku}</td>
                          <td>{row.variantDetails}</td>
                          <td>{row.warehouseName}</td>
                          <td>{row.warehouseCode}</td>
                          <td className="inventory-print-num">
                            {formatStockNumber(row.stockQuantity)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            <div className="inventory-print-footer">
              Generated on {reportGeneratedAt} | CRM Inventory Reporting
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
