'use client';

import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import type { ProductDTO } from '@/core/api/generated/spring/schemas/ProductDTO';
import type { ProductImageDTO } from '@/core/api/generated/spring/schemas/ProductImageDTO';
import type { ProductVariantDTO } from '@/core/api/generated/spring/schemas/ProductVariantDTO';
import type { ProductVariantImageDTO } from '@/core/api/generated/spring/schemas/ProductVariantImageDTO';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';

type MatrixAttribute = {
  id: number;
  label: string;
  values: Array<{ label: string; sortOrder: number }>;
};

type VariantMatrix = {
  columnAttribute?: MatrixAttribute;
  rowAttribute?: MatrixAttribute;
  columnLabels: string[];
  rowLabels: string[];
  values: Record<string, Record<string, number>>;
};

type SheetImage = ProductImageDTO | ProductVariantImageDTO;
type OptionLabelsById = Map<number, string>;
type MatrixAxisPreference = 'size' | 'color' | 'other';

function getMatrixAxisPreference(label: string) {
  const normalizedLabel = label.trim().toLowerCase();

  if (
    normalizedLabel.includes('size') ||
    normalizedLabel.includes('sizing') ||
    normalizedLabel.includes('dimension')
  ) {
    return 'size' as MatrixAxisPreference;
  }

  if (
    normalizedLabel.includes('color') ||
    normalizedLabel.includes('colour') ||
    normalizedLabel.includes('shade')
  ) {
    return 'color' as MatrixAxisPreference;
  }

  return 'other' as MatrixAxisPreference;
}

function getImageUrl(image?: SheetImage) {
  const sourceUrl =
    image?.thumbnailUrl ||
    image?.cdnUrl ||
    ('gumletPath' in (image ?? {}) ? image.gumletPath : null);

  if (!sourceUrl) {
    return null;
  }

  const resolvedUrl = resolveCatalogImageUrl(sourceUrl);

  if (!resolvedUrl) {
    return null;
  }

  if (!/^https?:\/\//i.test(resolvedUrl)) {
    return resolvedUrl;
  }

  return new URL(
    `/api/image-proxy?url=${encodeURIComponent(resolvedUrl)}`,
    window.location.origin
  ).toString();
}

function getSortedImages(images: SheetImage[]) {
  return [...images].sort(
    (left, right) =>
      (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.displayOrder ?? Number.MAX_SAFE_INTEGER)
  );
}

function getSelectionDisplayValue(
  selection: NonNullable<ProductVariantDTO['selections']>[number],
  optionLabelsById?: OptionLabelsById
) {
  const optionId = selection.option?.id;
  const resolvedOptionLabel =
    typeof optionId === 'number' ? optionLabelsById?.get(optionId) : undefined;

  return (
    selection.option?.label ||
    resolvedOptionLabel ||
    selection.rawValue ||
    selection.option?.code ||
    ''
  );
}

function formatRate(price?: number) {
  if (price === undefined || price === null) {
    return 'N/A';
  }

  return Number.isInteger(price)
    ? `${price}/- (Exc. of GST)`
    : `${price.toFixed(2)}/- (Exc. of GST)`;
}

function sortLabels(values: Array<{ label: string; sortOrder: number }>) {
  return [...values]
    .sort((left, right) => {
      const sortDiff = left.sortOrder - right.sortOrder;

      if (sortDiff !== 0) {
        return sortDiff;
      }

      const leftNumber = Number(left.label);
      const rightNumber = Number(right.label);
      const bothNumeric = !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber);

      if (bothNumeric) {
        return leftNumber - rightNumber;
      }

      return left.label.localeCompare(right.label, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    })
    .map((entry) => entry.label);
}

function capitalizeLabel(label?: string) {
  if (!label) {
    return '';
  }

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildVariantMatrix(
  variants: ProductVariantDTO[],
  optionLabelsById?: OptionLabelsById
): VariantMatrix | null {
  const activeVariants = variants.filter(
    (variant) => (variant.stockQuantity ?? 0) > 0 || (variant.selections?.length ?? 0) > 0
  );

  if (activeVariants.length === 0) {
    return null;
  }

  const attributeMap = new Map<number, MatrixAttribute>();

  activeVariants.forEach((variant) => {
    (variant.selections ?? []).forEach((selection) => {
      const attributeId = selection.attribute?.id;

      if (typeof attributeId !== 'number') {
        return;
      }

      const existing = attributeMap.get(attributeId) ?? {
        id: attributeId,
        label:
          selection.attribute?.label || selection.attribute?.name || `Attribute ${attributeId}`,
        values: [],
      };
      const optionLabel = getSelectionDisplayValue(selection, optionLabelsById);

      if (optionLabel && !existing.values.some((value) => value.label === optionLabel)) {
        existing.values.push({
          label: optionLabel,
          sortOrder: selection.option?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        });
      }

      attributeMap.set(attributeId, existing);
    });
  });

  const attributes = [...attributeMap.values()].sort((left, right) => {
    const countDiff = right.values.length - left.values.length;

    if (countDiff !== 0) {
      return countDiff;
    }

    return left.label.localeCompare(right.label);
  });

  const sizeAttribute = attributes.find(
    (attribute) => getMatrixAxisPreference(attribute.label) === 'size'
  );
  const colorAttribute = attributes.find(
    (attribute) => getMatrixAxisPreference(attribute.label) === 'color'
  );

  const rowAttribute = attributes.length > 1 ? (colorAttribute ?? attributes[1]) : undefined;
  const columnAttribute =
    sizeAttribute && sizeAttribute.id !== rowAttribute?.id
      ? sizeAttribute
      : (attributes.find((attribute) => attribute.id !== rowAttribute?.id) ?? attributes[0]);

  if (!columnAttribute) {
    return null;
  }

  const columnLabels = sortLabels(columnAttribute.values);
  const rowLabels = rowAttribute ? sortLabels(rowAttribute.values) : ['Quantity'];
  const values: Record<string, Record<string, number>> = {};

  rowLabels.forEach((rowLabel) => {
    values[rowLabel] = {};
    columnLabels.forEach((columnLabel) => {
      values[rowLabel][columnLabel] = 0;
    });
  });

  activeVariants.forEach((variant) => {
    const selectionByAttributeId = new Map(
      (variant.selections ?? [])
        .map((selection) => {
          const attributeId = selection.attribute?.id;
          const value = getSelectionDisplayValue(selection, optionLabelsById);

          return typeof attributeId === 'number' && value ? [attributeId, value] : null;
        })
        .filter((entry): entry is [number, string] => Boolean(entry))
    );

    const columnLabel = selectionByAttributeId.get(columnAttribute.id);
    const rowLabel = rowAttribute ? selectionByAttributeId.get(rowAttribute.id) : 'Quantity';

    if (!columnLabel || !rowLabel) {
      return;
    }

    if (!values[rowLabel]) {
      values[rowLabel] = {};
    }

    values[rowLabel][columnLabel] =
      (values[rowLabel][columnLabel] ?? 0) + (variant.stockQuantity ?? 0);
  });

  return {
    columnAttribute,
    rowAttribute,
    columnLabels,
    rowLabels,
    values,
  };
}

function ProductDownloadSheet({
  organizationName,
  product,
  variants,
  images,
  optionLabelsById,
}: {
  organizationName?: string;
  product: ProductDTO;
  variants: ProductVariantDTO[];
  images: SheetImage[];
  optionLabelsById?: OptionLabelsById;
}) {
  const sortedImages = getSortedImages(images).slice(0, 4);
  const primaryImage = sortedImages[0];
  const secondaryImages = sortedImages.slice(1, 4);
  const secondaryImageSlots =
    secondaryImages.length > 0 ? secondaryImages : [undefined, undefined, undefined];
  const matrix = buildVariantMatrix(variants, optionLabelsById);
  const rate = product.salePrice ?? product.discountedPrice ?? product.basePrice;

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: '#ffffff',
        color: '#111827',
        padding: '40px 42px',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: '14px',
          marginBottom: '28px',
        }}
      >
        <span>Date : {format(new Date(), 'dd/MM/yyyy')}</span>
      </div>

      <div style={{ marginBottom: '26px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '24px',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>
            Product Name : {product.name || 'Product'}
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            Organization Name : {organizationName || 'Organization'}
          </div>
        </div>
      </div>

      <div
        style={{
          border: '1px solid #111827',
          padding: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.95fr',
            gap: '26px',
            alignItems: 'start',
            minHeight: '360px',
          }}
        >
          <div
            style={{
              border: '1px solid #9ca3af',
              height: '305px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              position: 'relative',
            }}
          >
            {getImageUrl(primaryImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(primaryImage)!}
                alt={`${product.name || 'Product'} main`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>No image</span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
              gap: '20px',
              minHeight: '305px',
            }}
          >
            {secondaryImageSlots.map((image, index) => {
              const imageUrl = getImageUrl(image);
              const isThirdSlot = index === 2;

              return (
                <div
                  key={`product-sheet-secondary-image-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isThirdSlot ? 'flex-end' : 'stretch',
                    gridColumn: isThirdSlot ? '1 / span 2' : 'auto',
                    gridRow: isThirdSlot ? '2' : '1',
                  }}
                >
                  <div
                    style={{
                      width: isThirdSlot ? 'calc(50% - 10px)' : '100%',
                      border: '1px solid #9ca3af',
                      height: '124px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={`${product.name || 'Product'} ${index + 2}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>No image</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '18px', lineHeight: 1.7 }}>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>
          Article : {product.articleNumber || product.articalNumber || product.barcodeText || 'N/A'}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>RATE : {formatRate(rate)}</div>
      </div>

      {matrix ? (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '17px',
            marginTop: '16px',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '1px solid #cbd5e1',
                  minWidth: '150px',
                }}
              >
                {capitalizeLabel(matrix.rowAttribute?.label) || 'Variant'}
              </th>
              {matrix.columnLabels.map((columnLabel) => (
                <th
                  key={`column-${columnLabel}`}
                  style={{
                    textAlign: 'center',
                    padding: '10px 12px',
                    borderBottom: '1px solid #cbd5e1',
                    fontWeight: 700,
                  }}
                >
                  {columnLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rowLabels.map((rowLabel) => (
              <tr key={`row-${rowLabel}`}>
                <td
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    fontWeight: 600,
                  }}
                >
                  {rowLabel}
                </td>
                {matrix.columnLabels.map((columnLabel) => (
                  <td
                    key={`${rowLabel}-${columnLabel}`}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                    }}
                  >
                    {matrix.values[rowLabel]?.[columnLabel] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '15px',
            marginTop: '16px',
          }}
        >
          <thead>
            <tr>
              {['Link ID', 'SKU', 'Stock'].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: header === 'Stock' ? 'center' : 'left',
                    padding: '10px 12px',
                    borderBottom: '1px solid #cbd5e1',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id ?? variant.sku}>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  {variant.linkId || '—'}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  {variant.sku}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  {variant.stockQuantity ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div
        style={{
          marginTop: '42px',
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: '13px',
          color: '#475569',
        }}
      >
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}

function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll('img'));

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();

            return;
          }

          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );
}

function waitForPaint(targetWindow: Window = window) {
  return new Promise<void>((resolve) => {
    targetWindow.requestAnimationFrame(() => targetWindow.requestAnimationFrame(() => resolve()));
  });
}

export async function downloadProductSheetPdf(
  organizationName: string | undefined,
  product: ProductDTO,
  variants: ProductVariantDTO[],
  primaryVariantImages: ProductVariantImageDTO[] = [],
  optionLabelsById?: OptionLabelsById
) {
  let iframe: HTMLIFrameElement | null = null;
  let renderHost: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  try {
    iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.left = '-100000px';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = frameWindow?.document;

    if (!frameWindow || !frameDocument) {
      throw new Error('Unable to initialize PDF export document.');
    }

    frameDocument.open();
    frameDocument.write(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Product Sheet</title>
        </head>
        <body style="margin:0;background:#ffffff;"></body>
      </html>`);
    frameDocument.close();

    renderHost = frameDocument.createElement('div');
    frameDocument.body.appendChild(renderHost);

    const imagesForSheet =
      primaryVariantImages.length > 0 ? primaryVariantImages : (product.images ?? []);

    root = createRoot(renderHost);
    root.render(
      <ProductDownloadSheet
        organizationName={organizationName}
        product={product}
        variants={variants}
        images={imagesForSheet}
        optionLabelsById={optionLabelsById}
      />
    );

    await waitForPaint(frameWindow);

    const sheetElement = renderHost.firstElementChild as HTMLElement | null;

    if (!sheetElement) {
      throw new Error('Unable to render product sheet.');
    }

    await waitForImages(sheetElement);

    const canvas = await html2canvas(sheetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const pageOverflowThreshold = 1;
    let heightLeft = imageHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imageWidth, imageHeight);
    heightLeft -= pageHeight;

    while (heightLeft > pageOverflowThreshold) {
      position = heightLeft - imageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imageWidth, imageHeight);
      heightLeft -= pageHeight;
    }

    const baseName =
      product.name?.trim() ||
      product.articleNumber?.trim() ||
      product.articalNumber?.trim() ||
      `product-${product.id ?? 'sheet'}`;
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]+/g, '-');

    pdf.save(`${safeName}.pdf`);
  } finally {
    root?.unmount();

    if (iframe && document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
