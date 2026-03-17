'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CrmCupLogo } from '@/components/branding/crm-cup-logo';

type LandingNavbarProps = {
  onStartBrewing?: () => void;
};

export default function LandingNavbar({ onStartBrewing }: LandingNavbarProps) {
  return (
    <header className="w-full border-b border-slate-700/80 bg-[#33424f]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center">
            <CrmCupLogo variant="seal" className="h-8 w-8 shrink-0" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">CRM Cup</span>
        </Link>

        <nav className="flex flex-col gap-4 sm:ml-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href="/about"
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              About Us
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Contact Us
            </Link>
          </div>
          {onStartBrewing ? (
            <Button
              size="sm"
              onClick={onStartBrewing}
              className="rounded-md border border-[#f0a71d] bg-[#ffb52e] px-5 text-sm font-semibold text-slate-950 sm:ml-3 hover:bg-[#ffbd42]"
            >
              Start Brewing
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-md border border-[#f0a71d] bg-[#ffb52e] px-5 text-sm font-semibold text-slate-950 sm:ml-3 hover:bg-[#ffbd42]"
            >
              <Link href="/">Start Brewing</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
