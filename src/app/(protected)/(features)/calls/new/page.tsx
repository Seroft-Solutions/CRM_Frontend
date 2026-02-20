'use client';

import { CallForm } from '../components/call-form';
import { PermissionGuard, useAccount } from '@/core/auth';
import { useEffect, useState } from 'react';

export default function CreateCallPage() {
  const [isBusinessPartner, setIsBusinessPartner] = useState(false);
  const { user } = useAccount();
  console.log('Current User:', user?.name);
  useEffect(() => {
    const handleBusinessPartnerToggle = (event: CustomEvent) => {
      setIsBusinessPartner(event.detail.enabled);
    };

    window.addEventListener('businessPartnerToggle', handleBusinessPartnerToggle as EventListener);

    return () => {
      window.removeEventListener(
        'businessPartnerToggle',
        handleBusinessPartnerToggle as EventListener
      );
    };
  }, []);

  return (
    <PermissionGuard
      requiredPermission="call:create"
      unauthorizedTitle="Access Denied to Create Call"
      unauthorizedDescription="You don't have permission to create new call records."
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
                <h1 className="text-xl font-semibold text-sidebar-foreground">Create New Lead</h1>
                <p className="text-sm text-sidebar-foreground/80">
                  {isBusinessPartner
                    ? `Add a new lead for ${user?.name || 'your account'}`
                    : 'Add a new lead to your sales pipeline'}
                </p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CallForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
