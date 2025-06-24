import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  BarChart,
  Phone,
  MessageSquare,
  Target,
  Coffee,
  Award,
  Zap,
} from 'lucide-react';

// Map of icon names to actual icon components
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
  icon: string; // The name of the icon from the iconMap
  title: string;
  description: string;
}

interface FeatureSectionProps {
  features: Feature[];
}

// Feature Card Component
function FeatureCard({ icon, title, description }: Feature) {
  const IconComponent = iconMap[icon as keyof typeof iconMap];

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="mb-2">
          {IconComponent && <IconComponent className="w-10 h-10 text-primary" />}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function FeatureSection({ features }: FeatureSectionProps) {
  return (
    <div className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Powerful CRM Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your customer relationships effectively and efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
