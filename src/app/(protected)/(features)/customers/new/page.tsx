import { CustomerForm } from '../components/customer-form';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Create Customer',
};

export default function CreateCustomerPage() {
  return (
    <PermissionGuard
      requiredPermission="customer:create"
      unauthorizedTitle="Access Denied to Create Customer"
      unauthorizedDescription="You don't have permission to create new customer records."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for Create Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <svg
                  className="w-4 h-4 text-sidebar-accent-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Create New Customer</h1>
                <p className="text-sm text-sidebar-foreground/80">Add a new customer to your database</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CustomerForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
