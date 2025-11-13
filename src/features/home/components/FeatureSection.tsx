import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Award,
  BarChart,
  Calendar,
  Coffee,
  MessageSquare,
  Phone,
  Target,
  Users,
  Zap,
} from 'lucide-react';

const iconMap = {
  Users,
  Calendar,
  BarChart,
  Phone,
  MessageSquare,
  Target,
  Coffee,
  Award,
  Zap,
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeatureSectionProps {
  features: Feature[];
}

function FeatureCard({ icon, title, description }: Feature) {
  const IconComponent = iconMap[icon as keyof typeof iconMap];

  return (
    <Card className="home-feature-card">
      <CardHeader className="pb-2 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sidebar-accent/15 text-sidebar-accent flex items-center justify-center">
          {IconComponent && <IconComponent className="w-6 h-6" />}
        </div>
        <CardTitle className="text-lg text-sidebar leading-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-sidebar opacity-80">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function FeatureSection({ features }: FeatureSectionProps) {
  return (
    <section className="relative py-24 px-4 bg-[radial-gradient(circle_at_top,var(--sidebar)/8,transparent_45%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-semibold tracking-[0.3em] text-sidebar opacity-70">CAPABILITIES</p>
          <h2 className="text-3xl md:text-4xl font-bold text-sidebar">
            Powerful CRM Features
          </h2>
          <p className="text-sidebar opacity-70 max-w-2xl mx-auto">
            Everything you need to manage your customer relationships effectively and efficiently.
            Built on the same palette that powers your internal platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={`${feature.title}-${index}`}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
