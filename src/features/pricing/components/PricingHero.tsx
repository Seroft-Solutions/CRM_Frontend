'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CrmCupLogo } from '@/components/branding/crm-cup-logo';
import dynamic from 'next/dynamic';

const MotionContainer = dynamic(
    () => import('@/features/home/components/motion-components').then((mod) => mod.MotionContainer),
    { ssr: false }
);
const MotionItem = dynamic(
    () => import('@/features/home/components/motion-components').then((mod) => mod.MotionItem),
    { ssr: false }
);

export default function PricingHero() {
    return (
        <section className="home-hero relative overflow-hidden py-24 px-6">
            <div className="absolute inset-x-0 -bottom-32 h-64 blur-[140px] opacity-60 pointer-events-none bg-[radial-gradient(circle_at_center,var(--sidebar-accent)_0%,transparent_60%)]" />
            <MotionContainer className="relative z-10 container mx-auto max-w-6xl">
                <MotionItem className="max-w-3xl space-y-6 text-center mx-auto">
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2">
                        <CrmCupLogo variant="seal" className="h-10 w-10 shrink-0" />
                        <p className="text-sm uppercase tracking-[0.3em] text-white/70">CRM CUP · PRICING</p>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                        Simple, transparent
                        <span className="block text-sidebar-accent">pricing for every team</span>
                    </h1>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto">
                        Start free, scale as you grow. No hidden fees, no surprises — just the tools your team
                        needs to brew better customer relationships.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                        <Button
                            asChild
                            size="lg"
                            variant="ghost"
                            className="bg-white/10 text-white border border-white/30 hover:bg-white/20 px-8 py-6 text-base font-semibold"
                        >
                            <Link href="/about">About Us</Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="ghost"
                            className="bg-white/10 text-white border border-white/30 hover:bg-white/20 px-8 py-6 text-base font-semibold"
                        >
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </MotionItem>
            </MotionContainer>
        </section>
    );
}
