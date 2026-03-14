'use client';

import { CrmCupLogo } from '@/components/branding/crm-cup-logo';

export default function CRMCupAnimation() {
  return (
    <div role="img" aria-label="CRM Cup logo" className="relative w-80 h-80 sm:w-96 sm:h-96">
      <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(242,161,88,0.34)_0%,_rgba(242,161,88,0.08)_42%,_transparent_72%)] blur-2xl" />
      <div className="absolute inset-0 animate-[float_6s_ease-in-out_infinite]">
        <CrmCupLogo className="relative z-10 h-full w-full drop-shadow-[0_20px_55px_rgba(242,161,88,0.32)]" />
      </div>
    </div>
  );
}
