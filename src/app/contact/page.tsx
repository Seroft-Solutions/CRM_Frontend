import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Mail, MessageCircle, PhoneCall } from 'lucide-react';

import { ToasterProvider } from '@/components/toaster-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/features/contact/components/ContactForm';
import { contactDetails } from '@/features/contact/contact-schema';

const contactEmail = contactDetails.email;
const contactPhone = contactDetails.phoneDisplay;
const whatsappNumber = contactDetails.whatsappNumber;
const emailSubject = 'CRM Cup inquiry';
const emailBody =
  'Hello CRM Cup,%0A%0AI would like to know more about your application.%0A%0AName:%0ACompany:%0APhone:%0AMessage:%0A';

const emailHref = `mailto:${contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${emailBody}`;
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  'Hello CRM Cup, I would like to know more about your application.'
)}`;

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Reach CRM Cup by email or WhatsApp for product questions and support.',
};

const directChannels = [
  {
    title: 'Email us',
    description: 'Use direct email if you want to skip the form.',
    value: contactEmail,
    href: emailHref,
    icon: Mail,
    external: false,
  },
  {
    title: 'Chat on WhatsApp',
    description: 'Use WhatsApp when you want a faster conversation.',
    value: contactPhone,
    href: whatsappHref,
    icon: MessageCircle,
    external: true,
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <ToasterProvider />
      <main className="min-h-screen bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sidebar)_3%,white),white_24%,color-mix(in_srgb,var(--sidebar)_7%,white)_100%)]">
        <section className="home-hero px-6 pb-14 pt-10 text-white">
          <div className="mx-auto max-w-6xl space-y-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/72 transition hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="max-w-3xl space-y-5">
              <Badge className="rounded-full bg-white/12 px-4 py-1 text-white hover:bg-white/12">
                Contact CRM Cup
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">
                Contact the team
                <span className="block text-sidebar-accent">without the clutter.</span>
              </h1>
              <p className="text-base leading-7 text-white/80 md:text-lg">
                Use the form for a proper inquiry, or contact CRM Cup directly by email or
                WhatsApp. One page, one decision, no repeated sections.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {directChannels.map((channel) => {
                const Icon = channel.icon;

                return (
                  <a
                    key={channel.title}
                    href={channel.href}
                    target={channel.external ? '_blank' : undefined}
                    rel={channel.external ? 'noreferrer' : undefined}
                    className="inline-flex items-center gap-3 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm text-white transition hover:bg-white/12"
                  >
                    <span className="rounded-full bg-white/12 p-2">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{channel.title}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <ContactForm />

            <aside className="space-y-5 lg:pt-3">
              <Card className="border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl text-sidebar">Direct contact</CardTitle>
                  <CardDescription className="text-sm leading-6 text-sidebar/70">
                    Use one of these if you do not want to use the form.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {directChannels.map((channel) => {
                    const Icon = channel.icon;

                    return (
                      <a
                        key={channel.title}
                        href={channel.href}
                        target={channel.external ? '_blank' : undefined}
                        rel={channel.external ? 'noreferrer' : undefined}
                        className="block rounded-2xl border border-sidebar/10 p-4 transition hover:border-sidebar/20 hover:bg-sidebar/3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-sidebar/6 p-2 text-sidebar">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-sidebar">{channel.title}</p>
                            <p className="text-sm text-sidebar/65">{channel.description}</p>
                            <p className="pt-1 text-sm font-medium text-sidebar">{channel.value}</p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-sidebar/10 bg-sidebar text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl">What this page does</CardTitle>
                  <CardDescription className="text-sm leading-6 text-white/70">
                    Keeps contact simple and routes form submissions to your fixed inbox.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    'Visitors can access this page publicly.',
                    `Form submissions go to ${contactEmail}.`,
                    'WhatsApp remains available for quick follow-up.',
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                      <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-accent" />
                      <p className="text-sm leading-6 text-white/75">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
