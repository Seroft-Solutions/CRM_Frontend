'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee } from 'lucide-react';
import { signIn } from 'next-auth/react';
import HeroSection from "@/features/home/components/HeroSection";
import FeatureSection from "@/features/home/components/FeatureSection";
import CtaSection from "@/features/home/components/CtaSection";
import Footer from "@/features/home/components/Footer";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Handle Start Brewing click - initiate Keycloak sign-in after brief loading animation
  const handleStartBrewing = () => {
    setIsLoading(true);
    setTimeout(() => {
      signIn('keycloak', { redirectTo: '/organization' });
    }, 800); // Match the loading animation time for consistency
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Coffee className="w-12 h-12 text-primary animate-bounce mb-4" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Brewing your experience...</p>
        </div>
      </div>
    );
  }

  // Define features for the FeatureSection
  const features = [
    {
      icon: 'Users',
      title: 'Contact Management',
      description:
        'Centralize contact information and track every detail about your customers and prospects in one place.',
    },
    {
      icon: 'Phone',
      title: 'Call Tracking',
      description:
        'Log all customer calls and set reminders for follow-ups to never miss an opportunity for engagement.',
    },
    {
      icon: 'Calendar',
      title: 'Meeting Scheduler',
      description:
        'Schedule and manage meetings with clients directly in the platform and send automatic reminders.',
    },
    {
      icon: 'Target',
      title: 'Business Partner Management',
      description:
        'Create seamless workflows with your business partners and track shared opportunities for growth.',
    },
    {
      icon: 'MessageSquare',
      title: 'Communication Tracking',
      description:
        'Keep records of all customer communications and access conversation history instantly from anywhere.',
    },
    {
      icon: 'BarChart',
      title: 'Reports & Analytics',
      description:
        'Get actionable insights on sales performance, customer engagement, and team productivity metrics.',
    },
    {
      icon: 'Award',
      title: 'Customer Loyalty Programs',
      description:
        'Design and implement loyalty programs that keep your customers coming back for more.',
    },
    {
      icon: 'Zap',
      title: 'Smart Automation',
      description:
        'Automate routine tasks and communications to save time and ensure consistent customer experiences.',
    },
    {
      icon: 'Coffee',
      title: 'Customizable CRM',
      description:
        'Tailor the CRM to your specific business needs with custom fields, workflows, and integrations.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main>
        <HeroSection onStartBrewing={handleStartBrewing} />
        <FeatureSection features={features} />
        <CtaSection onStartBrewing={handleStartBrewing} />
      </main>
      <Footer />
    </div>
  );
}
