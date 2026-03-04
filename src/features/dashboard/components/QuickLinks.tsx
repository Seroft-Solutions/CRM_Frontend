'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, History, Archive, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function QuickLinks() {
  const links = [
    {
      title: 'Previous Lead',
      description: 'View previous leads',
      href: '/calls?status=previous',
      icon: ArrowLeft,
      bgColor: '#f8fafc',
      textColor: '#1e293b',
      iconBg: '#e2e8f0',
    },
    {
      title: 'Old Lead',
      description: 'View old leads',
      href: '/calls?status=old',
      icon: History,
      bgColor: '#f8fafc',
      textColor: '#1e293b',
      iconBg: '#e2e8f0',
    },
    {
      title: 'Lead Closed',
      description: 'View closed leads',
      href: '/calls?status=closed',
      icon: CheckCircle,
      bgColor: '#f0fdf4',
      textColor: '#166534',
      iconBg: '#dcfce7',
    },
  ];

  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold mb-3">Quick Links</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {links.map((link) => (
          <Link key={link.title} href={link.href} className="block">
            <Card
              className="relative overflow-hidden border transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer"
              style={{ backgroundColor: link.bgColor }}
            >
              <CardContent className="relative p-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: link.iconBg }}
                  >
                    <link.icon className="h-4 w-4" style={{ color: link.textColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold" style={{ color: link.textColor }}>
                      {link.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
