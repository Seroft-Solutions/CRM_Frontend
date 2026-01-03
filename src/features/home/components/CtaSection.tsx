'use client';

import { Button } from '@/components/ui/button';
import { safeSignIn } from '@/core/auth';

interface CtaSectionProps {
  onStartBrewing?: () => void;
}

export default function CtaSection({ onStartBrewing }: CtaSectionProps) {
  const handleStartBrewing = () => {
    if (onStartBrewing) {
      onStartBrewing();
    } else {
      safeSignIn('keycloak', { redirectTo: '/organization' });
    }
  };

  return (
    <section className="bg-sidebar text-white py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-white/60">GET STARTED</p>
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to brew better customer relationships?
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Join thousands of businesses using CRM Cup to manage and grow their customer relationships
          with confidence.
        </p>
        <Button
          size="lg"
          onClick={handleStartBrewing}
          className="btn-sidebar-accent px-10 py-6 text-base font-semibold"
        >
          Start Brewing Now
        </Button>
      </div>
    </section>
  );
}
