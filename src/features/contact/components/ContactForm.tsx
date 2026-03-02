'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, MessageCircle, SendHorizonal } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  contactDetails,
  contactFormSchema,
  type ContactFormValues,
} from '@/features/contact/contact-schema';

const defaultValues: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  preferredChannel: 'email',
  message: '',
  website: '',
};

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send your message');
      }

      setIsSubmitted(true);
      form.reset(defaultValues);
      toast.success('Your message has been sent to CRM Cup.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send your message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-white/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-3 border-b border-sidebar/8 pb-6">
        <CardTitle className="text-3xl leading-tight text-sidebar">Tell CRM Cup what you need.</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6 text-sidebar/70">
          Send your requirement, support request, or product inquiry here. The message is routed to{' '}
          {contactDetails.email}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 p-6 md:p-8">
        {isSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="text-sm font-semibold uppercase tracking-[0.25em]">Message sent</p>
            <p className="mt-2 text-sm leading-6">
              Your inquiry has been forwarded to {contactDetails.email}. If you need immediate
              follow-up, you can also reach the team on WhatsApp at {contactDetails.phoneDisplay}.
            </p>
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              {...form.register('website')}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-sidebar/8 bg-white p-4">
                    <FormLabel className="text-sidebar">Your name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        disabled={isSubmitting}
                        className="h-11 rounded-xl border-sidebar/10 bg-sidebar/2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-sidebar/8 bg-white p-4">
                    <FormLabel className="text-sidebar">Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        disabled={isSubmitting}
                        className="h-11 rounded-xl border-sidebar/10 bg-sidebar/2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-sidebar/8 bg-white p-4">
                    <FormLabel className="text-sidebar">Phone number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional phone or WhatsApp number"
                        disabled={isSubmitting}
                        className="h-11 rounded-xl border-sidebar/10 bg-sidebar/2"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Optional, but useful if you want a callback.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-sidebar/8 bg-white p-4">
                    <FormLabel className="text-sidebar">Company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional company name"
                        disabled={isSubmitting}
                        className="h-11 rounded-xl border-sidebar/10 bg-sidebar/2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredChannel"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-sidebar/8 bg-white p-5">
                  <FormLabel className="text-sidebar">Preferred reply channel</FormLabel>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => field.onChange('email')}
                      disabled={isSubmitting}
                      className={`rounded-2xl border p-4 text-left transition ${
                        field.value === 'email'
                          ? 'border-primary bg-primary/7'
                          : 'border-sidebar/10 bg-white hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/12 p-2 text-primary">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sidebar">Email reply</p>
                          <p className="text-sm text-sidebar/65">Best for detailed responses.</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => field.onChange('whatsapp')}
                      disabled={isSubmitting}
                      className={`rounded-2xl border p-4 text-left transition ${
                        field.value === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-sidebar/10 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
                          <MessageCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sidebar">WhatsApp reply</p>
                          <p className="text-sm text-sidebar/65">Best for quick follow-up.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-sidebar/8 bg-white p-5">
                  <FormLabel className="text-sidebar">Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell CRM Cup how we can help you."
                      className="min-h-40 rounded-2xl border-sidebar/10 bg-sidebar/2"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include your requirement, question, or support need.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 rounded-2xl border border-sidebar/8 bg-sidebar/3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-sidebar">Ready to send?</p>
                <p className="text-sm text-sidebar/65">
                  Messages from this form are delivered to {contactDetails.email}.
                </p>
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting} className="rounded-xl">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendHorizonal className="h-4 w-4" />
                    Send message
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
