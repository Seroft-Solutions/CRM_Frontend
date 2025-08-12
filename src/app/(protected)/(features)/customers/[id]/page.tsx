// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced customer detail page with proper header and action buttons
// - Added back button, edit button, and consistent styling
// ===============================================================
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerDetails } from '@/app/(protected)/(features)/customers/components/customer-details';
import { PermissionGuard, InlinePermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface CustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Customer Details',
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="customer:read"
      unauthorizedTitle="Access Denied to Customer Details"
      unauthorizedDescription="You don't have permission to view this customer."
    >
      <div className="space-y-6">
        {/* Professional Header with Dotted Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg relative overflow-hidden">
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
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  />
                  <circle cx="9" cy="7" r="4" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m22 21-3-3m-18 3v-2a4 4 0 0 1 4-4h4"
                  />
                </svg>
              </div>

              {/* Title and Description */}
              <div>
                <h1 className="text-xl font-semibold text-white">Customer Details</h1>
                <p className="text-blue-100 text-sm">View and manage customer information</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CustomerDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
