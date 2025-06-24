'use client';

import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import dynamic from 'next/dynamic';

const CRMCupAnimation = dynamic(() => import('./CRMCupAnimation'), { ssr: false });
const MotionContainer = dynamic(
  () => import('./motion-components').then((mod) => mod.MotionContainer),
  { ssr: false }
);
const MotionItem = dynamic(() => import('./motion-components').then((mod) => mod.MotionItem), {
  ssr: false,
});

export default function HeroSection() {
  const handleStartBrewing = () => {
    signIn('keycloak', { redirectTo: '/organization' });
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-background py-24 px-4 overflow-hidden">
      <MotionContainer className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <MotionItem className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Brew Better <span className="text-primary">Customer Relationships</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              CRM Cup helps you manage contacts, track interactions, and nurture customer
              relationships all in one place.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                Centralized customer data management
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                Streamlined communication tracking
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                Enhanced business partner collaboration
              </li>
            </ul>
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleStartBrewing}
                className="bg-primary hover:bg-primary/90 text-white font-medium"
              >
                Start Brewing
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleStartBrewing}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Create Account
              </Button>
            </div>
          </MotionItem>
          <MotionItem className="flex-1 flex justify-center">
            <CRMCupAnimation />
          </MotionItem>
        </div>
      </MotionContainer>
    </div>
  );
}
