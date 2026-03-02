import { CustomerDetails } from '../components/customer-details';
import { CustomerLeadsTable } from '../components/customer-leads-table';
import { PermissionGuard } from '@/core/auth';
import { Eye, Users } from 'lucide-react';

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
        {/* Modern Centered Header for View Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Eye className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Customer Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View customer information and history</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CustomerDetails id={id} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CustomerLeadsTable customerId={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
