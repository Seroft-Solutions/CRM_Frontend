import { Suspense } from 'react';
import { CustomerDataImport } from './components/customer-data-import';

export const metadata = {
  title: 'Import Customers',
};

export default function ImportPage() {
  return (
    <div className="space-y-4">
      {/* Professional Header with Dotted Background */}
      <div className="feature-header bg-[oklch(0.45_0.06_243)] rounded-lg p-6 shadow-lg relative overflow-hidden">
        {/* Dotted background pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        ></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6"
                />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Bulk Import Customers</h1>
              <p className="text-blue-100">Import multiple customers at once</p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <CustomerDataImport />
      </Suspense>
    </div>
  );
}
