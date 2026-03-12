import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, Lightbulb, Rocket, Shield, Users } from 'lucide-react';

const pillars = [
    {
        icon: Eye,
        title: 'Our Vision',
        description:
            'To be the most intuitive CRM platform on the market — one that adapts to how teams actually work, not the other way around.',
    },
    {
        icon: Heart,
        title: 'Our Mission',
        description:
            'Empower businesses of every size to build lasting, meaningful relationships with their customers through smart, thoughtful tooling.',
    },
    {
        icon: Lightbulb,
        title: 'Innovation First',
        description:
            'We continuously ship features driven by real user feedback. Every release is shaped by the people who use CRM Cup daily.',
    },
    {
        icon: Shield,
        title: 'Trust & Security',
        description:
            'Enterprise-grade security without enterprise-grade complexity. Your data is encrypted, protected, and always yours.',
    },
    {
        icon: Users,
        title: 'Customer Obsessed',
        description:
            'Every decision — from UI colour choices to API design — is made with the end user in mind. You are at the centre of everything.',
    },
    {
        icon: Rocket,
        title: 'Always Growing',
        description:
            'We measure success by the growth of our customers. When you win, we win. That alignment drives everything we build.',
    },
];

export default function MissionSection() {
    return (
        <section className="relative py-24 px-4 bg-[radial-gradient(circle_at_top,var(--sidebar)/8,transparent_45%)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <p className="text-sm font-semibold tracking-[0.3em] text-sidebar opacity-70">
                        WHAT DRIVES US
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-sidebar">
                        Mission, Vision &amp; Values
                    </h2>
                    <p className="text-sidebar opacity-70 max-w-2xl mx-auto">
                        The principles that guide every product decision, partnership, and hire at CRM Cup.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pillars.map(({ icon: Icon, title, description }) => (
                        <Card key={title} className="home-feature-card">
                            <CardHeader className="pb-2 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-sidebar-accent/15 text-sidebar-accent flex items-center justify-center">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-lg text-sidebar leading-tight">{title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-sidebar opacity-80">{description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
