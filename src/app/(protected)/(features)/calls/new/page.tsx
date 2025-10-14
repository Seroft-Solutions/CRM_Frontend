// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced with dynamic header color based on Business Partner toggle
// ===============================================================
'use client';

import { CallForm } from '../components/call-form';
import {PermissionGuard, useAccount, useUserAuthorities} from '@/core/auth';
import { useState, useEffect } from 'react';

export default function CreateCallPage() {
  const [isBusinessPartner, setIsBusinessPartner] = useState(false);
  const { user} = useAccount();
  console.log('Current User:', user?.name);
  useEffect(() => {
    const handleBusinessPartnerToggle = (event: CustomEvent) => {
      setIsBusinessPartner(event.detail.enabled);
    };

    window.addEventListener('businessPartnerToggle', handleBusinessPartnerToggle as EventListener);

    return () => {
      window.removeEventListener('businessPartnerToggle', handleBusinessPartnerToggle as EventListener);
    };
  }, []);

  return (
    <PermissionGuard
      requiredPermission="call:create"
      unauthorizedTitle="Access Denied to Create Call"
      unauthorizedDescription="You don't have permission to create new call records."
    >
      <div className="space-y-6">
        {/* Professional Header with Dotted Background - Dynamic Color */}
        <div className={`rounded-lg p-6 shadow-lg relative overflow-hidden transition-colors duration-300 ${
          isBusinessPartner
            ? 'bg-bp-primary'
            : 'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}>
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex items-center gap-4 relative z-10">
            {/* Icon */}
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Create Call</h1>
              <p className="text-white/90">
                {isBusinessPartner
                    ? `Enter the details below to create a new call for ${user?.name || ''}`
                    : 'Enter the details below to create a new call'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CallForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
