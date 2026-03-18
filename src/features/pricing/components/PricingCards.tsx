'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';

type BillingCycle = 'monthly' | 'yearly';

const plans = [
    {
        name: 'Starter',
        price: 'Free',
        period: 'forever',
        tagline: 'Perfect for freelancers and small teams just getting started.',
        highlighted: false,
        features: [
            'Up to 500 contacts',
            '2 team seats',
            'Basic contact management',
            'Email communication tracking',
            'Standard reports',
            'Community support',
        ],
    },
    {
        name: 'Growth',
        pricing: {
            monthly: {
                amount: '₹1,000',
                period: 'per month',
            },
            yearly: {
                amount: '₹10,000',
                period: 'per year',
            },
        },
        tagline: 'For growing teams that need more power and automation.',
        highlighted: true,
        badge: 'Most Popular',
        features: [
            'Unlimited contacts',
            'Up to 25 team seats',
            'Advanced contact management',
            'Call & meeting tracking',
            'Business partner management',
            'Smart automation workflows',
            'Advanced analytics & reports',
            'Priority support',
        ],
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: 'tailored to your needs',
        tagline: 'Dedicated infrastructure, SLAs, and custom integrations for large orgs.',
        highlighted: false,
        features: [
            'Unlimited everything',
            'Unlimited team seats',
            'Custom integrations & API',
            'Dedicated account manager',
            'SLA guarantees',
            'SSO / SAML',
            'Advanced security & audit logs',
            'On-premise deployment option',
        ],
    },
];

export default function PricingCards() {
    const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');
    const handleSignIn = () => signIn('keycloak', { redirectTo: '/organization' });

    return (
        <section className="relative py-24 px-4 bg-[radial-gradient(circle_at_top,var(--sidebar)/8,transparent_45%)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <p className="text-sm font-semibold tracking-[0.3em] text-sidebar opacity-70">PLANS</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-sidebar">Choose your plan</h2>
                    <p className="text-sidebar opacity-70 max-w-2xl mx-auto">
                        All plans include a 14-day free trial. No credit card required.
                    </p>
                    <Tabs
                        value={billingCycle}
                        onValueChange={(value) => setBillingCycle(value as BillingCycle)}
                        className="items-center pt-4"
                    >
                        <TabsList className="h-11 rounded-full bg-sidebar/10 p-1">
                            <TabsTrigger
                                value="monthly"
                                className="rounded-full px-5 text-sm font-semibold data-[state=active]:bg-sidebar data-[state=active]:text-white"
                            >
                                Monthly
                            </TabsTrigger>
                            <TabsTrigger
                                value="yearly"
                                className="rounded-full px-5 text-sm font-semibold data-[state=active]:bg-sidebar data-[state=active]:text-white"
                            >
                                Yearly
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan) => {
                        const activePricing = 'pricing' in plan ? plan.pricing[billingCycle] : null;
                        const displayedPrice = activePricing?.amount ?? plan.price;

                        return (
                            <Card
                                key={plan.name}
                                className={cn(
                                    'relative flex flex-col rounded-3xl transition-shadow duration-300',
                                    plan.highlighted
                                        ? 'bg-sidebar text-white border-2 border-sidebar-accent shadow-[0_0_40px_rgba(245,184,29,0.2)]'
                                        : 'home-feature-card'
                                )}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-sidebar-accent text-[#0f172a] text-xs font-bold px-4 py-1.5 rounded-full shadow">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <CardHeader className="pb-4 pt-8 px-6 space-y-3">
                                    <p
                                        className={cn(
                                            'text-sm font-semibold tracking-widest uppercase',
                                            plan.highlighted ? 'text-sidebar-accent' : 'text-sidebar opacity-70'
                                        )}
                                    >
                                        {plan.name}
                                    </p>
                                    <CardTitle>
                                        <span
                                            className={cn(
                                                'text-4xl font-extrabold',
                                                plan.highlighted ? 'text-white' : 'text-sidebar'
                                            )}
                                        >
                                            {displayedPrice}
                                        </span>
                                        {activePricing && (
                                            <span
                                                className={cn(
                                                    'text-sm font-normal ml-1',
                                                    plan.highlighted ? 'text-white/60' : 'text-sidebar/60'
                                                )}
                                            >
                                                /{activePricing.period}
                                            </span>
                                        )}
                                    </CardTitle>
                                    <p
                                        className={cn(
                                            'text-sm',
                                            plan.highlighted ? 'text-white/70' : 'text-sidebar opacity-70'
                                        )}
                                    >
                                        {plan.tagline}
                                    </p>
                                </CardHeader>

                                <CardContent className="flex flex-col flex-1 px-6 pb-8 gap-6">
                                    <ul className="space-y-3 flex-1">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2.5">
                                                <Check
                                                    className={cn(
                                                        'w-4 h-4 mt-0.5 shrink-0',
                                                        plan.highlighted ? 'text-sidebar-accent' : 'text-sidebar-accent'
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        'text-sm',
                                                        plan.highlighted ? 'text-white/80' : 'text-sidebar opacity-80'
                                                    )}
                                                >
                                                    {f}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={handleSignIn}
                                        size="lg"
                                        className={cn(
                                            'w-full font-semibold',
                                            plan.highlighted
                                                ? 'btn-sidebar-accent'
                                                : 'bg-sidebar text-white hover:bg-sidebar/90'
                                        )}
                                    >
                                        {displayedPrice === 'Custom' ? 'Contact Sales' : 'Get Started'}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
