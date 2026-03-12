'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const MotionContainer = dynamic(
    () => import('@/features/home/components/motion-components').then((mod) => mod.MotionContainer),
    { ssr: false }
);
const MotionItem = dynamic(
    () => import('@/features/home/components/motion-components').then((mod) => mod.MotionItem),
    { ssr: false }
);

export default function AboutHero() {
    return (
        <section className="home-hero relative overflow-hidden py-24 px-6">
            <div className="absolute inset-x-0 -bottom-32 h-64 blur-[140px] opacity-60 pointer-events-none bg-[radial-gradient(circle_at_center,var(--sidebar-accent)_0%,transparent_60%)]" />
            <MotionContainer className="relative z-10 container mx-auto max-w-6xl">
                <MotionItem className="max-w-3xl space-y-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">CRM CUP · OUR STORY</p>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                        Brewed with purpose,
                        <span className="block text-sidebar-accent">built for people</span>
                    </h1>
                    <p className="text-lg text-white/80 max-w-2xl">
                        CRM Cup was founded on a simple belief: managing customer relationships should feel as
                        natural and energising as your morning coffee. We set out to build a platform that
                        removes friction and lets teams focus on what really matters — genuine connections.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                            asChild
                            size="lg"
                            className="btn-sidebar-accent px-8 py-6 text-base font-semibold"
                        >
                            <Link href="/pricing">See Pricing</Link>
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
