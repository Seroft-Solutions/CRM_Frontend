import Link from 'next/link';
import { CrmCupLogo } from '@/components/branding/crm-cup-logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-white py-12 px-4 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/10">
              <CrmCupLogo className="w-10 h-10" />
            </div>
            <span className="text-xl font-bold tracking-tight">CRM Cup</span>
          </div>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors">
              About Us
            </Link>
            <Link href="/pricing" className="text-sm text-white/70 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-sm text-white/70 hover:text-white transition-colors">
              Contact Us
            </Link>
          </nav>
          <div className="text-sm text-white/70 text-center md:text-right">
            &copy; {currentYear} CRM Cup. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
