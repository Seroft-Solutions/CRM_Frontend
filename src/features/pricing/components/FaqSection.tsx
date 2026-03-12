'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
    {
        q: 'Can I switch plans at any time?',
        a: 'Yes — you can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately and billing is prorated.',
    },
    {
        q: 'Is there a free trial?',
        a: 'All paid plans include a 14-day free trial with full feature access. No credit card is required to start.',
    },
    {
        q: 'How does per-seat pricing work?',
        a: 'Each "seat" is one user account. You can add or remove seats at any time and your bill adjusts accordingly.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) as well as bank transfers for annual Enterprise contracts.',
    },
    {
        q: 'Do you offer discounts for annual billing?',
        a: 'Yes — customers on annual billing save up to 20% compared to monthly billing. Contact our sales team to learn more.',
    },
    {
        q: 'What happens to my data if I cancel?',
        a: 'Your data remains fully accessible for 30 days after cancellation, giving you time to export everything you need.',
    },
];

export default function FaqSection() {
    return (
        <section className="py-24 px-4 bg-sidebar">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-12 space-y-4">
                    <p className="text-sm font-semibold tracking-[0.3em] text-white/50 uppercase">FAQ</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Common questions</h2>
                    <p className="text-white/60">
                        Anything else? Reach us any time at{' '}
                        <a href="/contact" className="text-sidebar-accent hover:underline">
                            our contact page
                        </a>
                        .
                    </p>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                    {faqs.map((faq, i) => (
                        <AccordionItem
                            key={i}
                            value={`faq-${i}`}
                            className="border border-white/10 rounded-2xl px-5 bg-white/5"
                        >
                            <AccordionTrigger className="text-white text-left font-medium hover:no-underline py-4">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-white/60 pb-4 text-sm leading-relaxed">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
