'use client';

import PricingHero from './PricingHero';
import PricingCards from './PricingCards';
import FaqSection from './FaqSection';
import CtaSection from '@/features/home/components/CtaSection';
import Footer from '@/features/home/components/Footer';

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main>
                <PricingHero />
                <PricingCards />
                <FaqSection />
                <CtaSection />
            </main>
            <Footer />
        </div>
    );
}
