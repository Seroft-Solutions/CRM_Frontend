'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export default function CtaSection() {
  const handleStartBrewing = () => {
    signIn('keycloak', { redirectTo: '/organization' });
  };

  return (
    <div className="bg-primary/10 py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Start Brewing?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of businesses using CRM Cup to manage and grow their customer
          relationships.
        </p>
        <Button size="lg" onClick={handleStartBrewing}>
          Start Brewing Now
        </Button>
      </div>
    </div>
  );
}
