'use client';

import AboutHero from './AboutHero';
import MissionSection from './MissionSection';
import TeamSection from './TeamSection';
import CtaSection from '@/features/home/components/CtaSection';
import Footer from '@/features/home/components/Footer';

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main>
                <AboutHero />
                <MissionSection />
                <TeamSection />
                <CtaSection />
            </main>
            <Footer />
        </div>
    );
}
