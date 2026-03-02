import { NextResponse } from 'next/server';

import { SPRING_API_URL } from '@/core/api/config/constants';
import { contactFormSchema } from '@/features/contact/contact-schema';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = contactFormSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Please correct the contact form fields and try again.',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (parsed.data.website) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { website: _website, ...values } = parsed.data;

    const response = await fetch(`${SPRING_API_URL}/api/public/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        company: values.company || undefined,
        preferredChannel: values.preferredChannel,
        message: values.message,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.message || payload?.error || 'Unable to send your message right now.',
        },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error: any) {
    console.error('Public contact route error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Unexpected error while sending your message.',
      },
      { status: 500 }
    );
  }
}
