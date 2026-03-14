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
import { ArrowDownUp, ArrowUpDown, FileDown, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ProductImageThumbnail } from '@/features/product-images/components/ProductImageThumbnail';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';
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
  imageUrl: string | null;
  productName: string;
  barcodeText: string;
  category: string;
  status: string;
  stockQuantity: number;
};

type WarehouseInventoryRow = {
  productId: number | null;
  imageUrl: string | null;
  productName: string;
  variantSku: string;
  variantDetails: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  stockQuantity: number;
};

type StockLevel = 'low' | 'medium' | 'high';
type StockSortDirection = 'desc' | 'asc';
type StockSortField = 'quantity' | 'level';

const INVENTORY_REPORT_PAGE_SIZE = 500;
const INVENTORY_REPORT_MAX_PAGES = 2000;
const numberFormatter = new Intl.NumberFormat('en-US');
const INVENTORY_CHART_COLORS = ['#0f6cbd', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

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

const getStockLevel = (stockQuantity: number): StockLevel => {
  if (stockQuantity <= 10) {
    return 'low';
  }
  if (stockQuantity <= 50) {
    return 'medium';
  }
  return 'high';
};

const getStockLevelWeight = (level: StockLevel) => {
  switch (level) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
};

const getStockLevelBadgeClassName = (level: StockLevel) => {
  switch (level) {
    case 'high':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'low':
    default:
      return 'border-rose-200 bg-rose-50 text-rose-700';
  }
};

const formatStockLevel = (level: StockLevel) => level.charAt(0).toUpperCase() + level.slice(1);

const getProductImageUrl = (product?: ProductWithStockQuantity | null) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  const image = images.find((item) => item.isPrimary) ?? images[0];

  if (!image) {
    return null;
  }

  return (
    image.thumbnailUrl ||
    image.cdnUrl ||
    (image.gumletPath ? resolveCatalogImageUrl(image.gumletPath) : null)
  );
};

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
  const [stockSortField, setStockSortField] = useState<StockSortField>('quantity');
  const [stockSortDirection, setStockSortDirection] = useState<StockSortDirection>('desc');
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
          imageUrl: getProductImageUrl(product),
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
      const imageUrl = getProductImageUrl(product);
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
                imageUrl,
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
              imageUrl,
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
          imageUrl: getProductImageUrl(product),
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
  const sortInventoryRows = <T extends { productName: string; stockQuantity: number }>(rows: T[]) =>
    [...rows].sort((a, b) => {
      if (stockSortField === 'level') {
        const levelDelta =
          getStockLevelWeight(getStockLevel(b.stockQuantity)) -
          getStockLevelWeight(getStockLevel(a.stockQuantity));

        if (levelDelta !== 0) {
          return stockSortDirection === 'desc' ? levelDelta : -levelDelta;
        }
      }

      const quantityDelta = b.stockQuantity - a.stockQuantity;

      if (quantityDelta !== 0) {
        return stockSortDirection === 'desc' ? quantityDelta : -quantityDelta;
      }

      return a.productName.localeCompare(b.productName);
    });

  const filteredOverallRows = useMemo(() => {
    const rows = !normalizedSearchTerm
      ? overallRows
      : overallRows.filter((row) =>
          [row.productName, row.barcodeText, row.category, row.status]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearchTerm)
        );

    return sortInventoryRows(rows);
  }, [normalizedSearchTerm, overallRows, stockSortDirection, stockSortField]);

  const filteredWarehouseRows = useMemo(() => {
    const rows = !normalizedSearchTerm
      ? warehouseRows
      : warehouseRows.filter((row) =>
          [row.productName, row.variantSku, row.variantDetails, row.warehouseName, row.warehouseCode]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearchTerm)
        );

    return sortInventoryRows(rows);
  }, [normalizedSearchTerm, warehouseRows, stockSortDirection, stockSortField]);

  const stockLevelSummary = useMemo(() => {
    const rows = viewMode === 'overall' ? filteredOverallRows : filteredWarehouseRows;

    return rows.reduce(
      (acc, row) => {
        acc[getStockLevel(row.stockQuantity)] += 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0 } as Record<StockLevel, number>
    );
  }, [filteredOverallRows, filteredWarehouseRows, viewMode]);

  const stockLevelChartData = useMemo(
    () => [
      { name: 'Low', value: stockLevelSummary.low, fill: '#ef4444' },
      { name: 'Medium', value: stockLevelSummary.medium, fill: '#f59e0b' },
      { name: 'High', value: stockLevelSummary.high, fill: '#22c55e' },
    ].filter((item) => item.value > 0),
    [stockLevelSummary]
  );

  const topStockChartData = useMemo(() => {
    if (viewMode === 'overall') {
      return filteredOverallRows.slice(0, 6).map((row) => ({
        name: row.productName,
        stock: row.stockQuantity,
      }));
    }

    return filteredWarehouseRows.slice(0, 6).map((row) => ({
      name: `${row.productName} (${row.warehouseCode})`,
      stock: row.stockQuantity,
    }));
  }, [filteredOverallRows, filteredWarehouseRows, viewMode]);

  const updateStockSort = (field: StockSortField) => {
    if (stockSortField === field) {
      setStockSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }

    setStockSortField(field);
    setStockSortDirection(field === 'level' ? 'asc' : 'desc');
  };

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

            <div className="w-full sm:flex sm:justify-end">
              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as InventoryViewMode)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1 sm:w-[420px]">
                  <TabsTrigger
                    value="overall"
                    className="rounded-lg px-4 py-3 text-center text-sm leading-4 font-semibold whitespace-normal text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Overall Inventory
                  </TabsTrigger>
                  <TabsTrigger
                    value="warehouse"
                    className="rounded-lg px-4 py-3 text-center text-sm leading-4 font-semibold whitespace-normal text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  >
                    Inventory Per Warehouse
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  viewMode === 'overall'
                    ? 'Search products, barcode, category...'
                    : 'Search product, variant, warehouse, code...'
                }
                className="h-10 rounded-xl border-slate-200 pl-9 shadow-sm"
              />
            </div>

            <Button
              type="button"
              onClick={handleGeneratePdf}
              disabled={!canGenerateReport}
              className="h-10 rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Generate Inventory Report
            </Button>
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
                <Badge className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50">
                  Low: {stockLevelSummary.low}
                </Badge>
                <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                  Medium: {stockLevelSummary.medium}
                </Badge>
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  High: {stockLevelSummary.high}
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <Card className="border-slate-200 shadow-sm lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Stock Items</CardTitle>
                    <CardDescription>
                      Highest-stock products in the current inventory view.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0">
                    {topStockChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={topStockChartData}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                        >
                          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            stroke="#64748b"
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip formatter={(value) => [formatStockNumber(Number(value)), 'Stock']} />
                          <Bar dataKey="stock" radius={[0, 8, 8, 0]}>
                            {topStockChartData.map((entry, index) => (
                              <Cell
                                key={`${entry.name}-${index}`}
                                fill={INVENTORY_CHART_COLORS[index % INVENTORY_CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                        No stock data available for visualization.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Stock Level Distribution</CardTitle>
                    <CardDescription>Low, medium, and high stock split.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stockLevelChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={stockLevelChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            label={({ name, percent }) =>
                              `${name} ${((percent || 0) * 100).toFixed(0)}%`
                            }
                          >
                            {stockLevelChartData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Items']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                        No stock level data available for visualization.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="max-h-[420px] overflow-y-auto">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 z-20 w-[12%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Image
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[17.6%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Product
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[17.6%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Barcode
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[17.6%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Category
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[17.6%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Status
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[17.6%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStockSort('level')}
                            className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-100"
                          >
                            Stock Level
                            <ArrowDownUp className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[17.6%] bg-slate-50/95 text-right text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStockSort('quantity')}
                            className="ml-auto h-8 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-100"
                          >
                            Stock
                            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOverallRows.length > 0 ? (
                        filteredOverallRows.map((row) => (
                          <TableRow
                            key={row.productId ?? row.productName}
                            className="border-slate-100 hover:bg-slate-50/70"
                          >
                            <TableCell>
                              <ProductImageThumbnail
                                imageUrl={row.imageUrl}
                                productName={row.productName}
                                size={40}
                                className="rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="truncate font-medium text-slate-900">
                              {row.productName}
                            </TableCell>
                            <TableCell className="truncate text-slate-600">
                              {row.barcodeText || 'N/A'}
                            </TableCell>
                            <TableCell className="truncate text-slate-600">{row.category}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-slate-700"
                              >
                                {row.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStockLevelBadgeClassName(getStockLevel(row.stockQuantity))}
                              >
                                {formatStockLevel(getStockLevel(row.stockQuantity))}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex min-w-[88px] justify-end rounded-lg bg-slate-50 px-3 py-2 font-semibold tabular-nums text-slate-900">
                                {formatStockNumber(row.stockQuantity)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                <Badge className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50">
                  Low: {stockLevelSummary.low}
                </Badge>
                <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                  Medium: {stockLevelSummary.medium}
                </Badge>
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  High: {stockLevelSummary.high}
                </Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <Card className="border-slate-200 shadow-sm lg:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Warehouse Stock Rows</CardTitle>
                    <CardDescription>
                      Highest-stock product and warehouse combinations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0">
                    {topStockChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={topStockChartData}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                        >
                          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#64748b" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            stroke="#64748b"
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip formatter={(value) => [formatStockNumber(Number(value)), 'Stock']} />
                          <Bar dataKey="stock" radius={[0, 8, 8, 0]}>
                            {topStockChartData.map((entry, index) => (
                              <Cell
                                key={`${entry.name}-${index}`}
                                fill={INVENTORY_CHART_COLORS[index % INVENTORY_CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                        No warehouse stock data available for visualization.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Stock Level Distribution</CardTitle>
                    <CardDescription>Low, medium, and high stock split.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stockLevelChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={stockLevelChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            label={({ name, percent }) =>
                              `${name} ${((percent || 0) * 100).toFixed(0)}%`
                            }
                          >
                            {stockLevelChartData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Rows']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                        No stock level data available for visualization.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="max-h-[420px] overflow-y-auto">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Image
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Product
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Variant SKU
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Variant Details
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Warehouse
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          Warehouse Code
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStockSort('level')}
                            className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-100"
                          >
                            Stock Level
                            <ArrowDownUp className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[12.5%] bg-slate-50/95 text-right text-slate-600 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStockSort('quantity')}
                            className="ml-auto h-8 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-100"
                          >
                            Stock
                            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarehouseRows.length > 0 ? (
                        filteredWarehouseRows.map((row) => (
                          <TableRow
                            key={`${row.productId ?? 'N/A'}-${row.variantSku}-${row.warehouseId}-${row.variantDetails}`}
                            className="border-slate-100 hover:bg-slate-50/70"
                          >
                            <TableCell>
                              <ProductImageThumbnail
                                imageUrl={row.imageUrl}
                                productName={row.productName}
                                size={40}
                                className="rounded-lg"
                              />
                            </TableCell>
                            <TableCell className="truncate font-medium text-slate-900">
                              {row.productName}
                            </TableCell>
                            <TableCell className="truncate text-slate-600">{row.variantSku}</TableCell>
                            <TableCell className="truncate text-slate-600">{row.variantDetails}</TableCell>
                            <TableCell className="truncate text-slate-600">{row.warehouseName}</TableCell>
                            <TableCell className="truncate text-slate-600">{row.warehouseCode}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStockLevelBadgeClassName(getStockLevel(row.stockQuantity))}
                              >
                                {formatStockLevel(getStockLevel(row.stockQuantity))}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex min-w-[88px] justify-end rounded-lg bg-slate-50 px-3 py-2 font-semibold tabular-nums text-slate-900">
                                {formatStockNumber(row.stockQuantity)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
