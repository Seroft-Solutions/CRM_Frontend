'use client';

import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import type { ProductCatalogDTO } from '@/core/api/generated/spring/schemas/ProductCatalogDTO';
import type { ProductVariantDTO } from '@/core/api/generated/spring/schemas/ProductVariantDTO';
import { resolveCatalogImageUrl } from '@/lib/utils/catalog-image-url';

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return null;
  }

  const resolvedUrl = resolveCatalogImageUrl(imageUrl);

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

function formatRate(price?: number) {
  if (price === undefined || price === null) {
    return 'N/A';
  }

  return Number.isInteger(price)
    ? `${price}/- (Exc. of GST)`
    : `${price.toFixed(2)}/- (Exc. of GST)`;
}

function CatalogDownloadSheet({
  organizationName,
  catalog,
  variants,
}: {
  organizationName?: string;
  catalog: ProductCatalogDTO;
  variants: ProductVariantDTO[];
}) {
  const imageUrl = getImageUrl(catalog.image);
  const productName = catalog.product?.name || 'Product';
  const catalogName = catalog.productCatalogName || 'Catalog';

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
            Catalog Name : {catalogName}
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
            gridTemplateColumns: '1fr',
            gap: '26px',
            alignItems: 'start',
            minHeight: '200px',
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
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`${catalogName} main`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>No image</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '18px', lineHeight: 1.7 }}>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>Product : {productName}</div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>RATE : {formatRate(catalog.price)}</div>
        {catalog.description && (
          <div style={{ fontSize: '16px', marginTop: '8px' }}>
            Description : {catalog.description}
          </div>
        )}
      </div>

      {variants.length > 0 && (
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

export async function downloadCatalogSheetPdf(
  organizationName: string | undefined,
  catalog: ProductCatalogDTO,
  variants: ProductVariantDTO[] = []
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
          <title>Catalog Sheet</title>
        </head>
        <body style="margin:0;background:#ffffff;"></body>
      </html>`);
    frameDocument.close();

    renderHost = frameDocument.createElement('div');
    frameDocument.body.appendChild(renderHost);

    root = createRoot(renderHost);
    root.render(
      <CatalogDownloadSheet
        organizationName={organizationName}
        catalog={catalog}
        variants={variants}
      />
    );

    await waitForPaint(frameWindow);

    const sheetElement = renderHost.firstElementChild as HTMLElement | null;

    if (!sheetElement) {
      throw new Error('Unable to render catalog sheet.');
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

    const baseName = catalog.productCatalogName?.trim() || `catalog-${catalog.id ?? 'sheet'}`;
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]+/g, '-');

    pdf.save(`${safeName}.pdf`);
  } finally {
    root?.unmount();

    if (iframe && document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}
