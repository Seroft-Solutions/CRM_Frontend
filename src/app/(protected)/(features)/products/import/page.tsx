import { Suspense } from 'react';
import { Upload } from 'lucide-react';
import { ProductDataImport } from './components/product-data-import';

export const metadata = {
  title: 'Import Products',
};

export default function ImportPage() {
  return (
    <div className="space-y-4">
      {/* Modern Centered Header */}
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          {/* Left Section: Icon and Title */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
              <Upload className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">Import Products</h1>
              <p className="text-sm text-sidebar-foreground/80">
                Bulk import your product data with variants
              </p>
            </div>
          </div>

          {/* Center Section: Empty for balance */}
          <div className="flex-1"></div>

          {/* Right Section: Spacer for balance */}
          <div className="flex-1"></div>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ProductDataImport />
      </Suspense>
    </div>
  );
}
