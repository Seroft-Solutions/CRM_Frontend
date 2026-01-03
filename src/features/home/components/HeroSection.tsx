'use client';

import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { safeSignIn } from '@/core/auth';

const CRMCupAnimation = dynamic(() => import('./CRMCupAnimation'), { ssr: false });
const MotionContainer = dynamic(
  () => import('./motion-components').then((mod) => mod.MotionContainer),
  { ssr: false }
);
const MotionItem = dynamic(() => import('./motion-components').then((mod) => mod.MotionItem), {
  ssr: false,
});

interface HeroSectionProps {
  onStartBrewing?: () => void;
}

export default function HeroSection({ onStartBrewing }: HeroSectionProps) {
  const handleStartBrewing = () => {
    if (onStartBrewing) {
      onStartBrewing();
    } else {
      safeSignIn('keycloak', { redirectTo: '/organization' });
    }
  };

  return (
    <section className="home-hero relative overflow-hidden py-24 px-6">
      <div className="absolute inset-x-0 -bottom-32 h-64 blur-[140px] opacity-60 pointer-events-none bg-[radial-gradient(circle_at_center,var(--sidebar-accent)_0%,transparent_60%)]" />
      <MotionContainer className="relative z-10 container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <MotionItem className="flex-1 space-y-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">CRM CUP</p>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                Brew Better
                <span className="block text-sidebar-accent">Customer Relationships</span>
              </h1>
            </div>
            <p className="text-lg text-white/80 max-w-2xl">
              Manage contacts, track every interaction, and collaborate with partners using a CRM
              experience that feels as smooth as your favorite brew.
            </p>
            <ul className="space-y-3 text-white/80">
              {[
                'Centralized customer data management',
                'Streamlined communication tracking',
                'Enhanced business partner collaboration',
              ].map((item) => (
                <li key={item} className="flex items-center text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-sidebar-accent mr-3 shadow-[0_0_12px_rgba(245,184,29,0.6)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-8 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleStartBrewing}
                className="btn-sidebar-accent px-8 py-6 text-base font-semibold"
              >
                Start Brewing
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleStartBrewing}
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 px-8 py-6 text-base font-semibold"
              >
                Create Account
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              {[{ label: 'Customer trust', value: '98%' }, { label: 'Avg. response boost', value: '3x' }].map(
                ({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-white"
                  >
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-white/70">{label}</p>
                  </div>
                )
              )}
            </div>
          </MotionItem>

          <MotionItem className="flex-1 flex justify-center">
            <CRMCupAnimation />
          </MotionItem>
        </div>
      </MotionContainer>
    </section>
  );
}
