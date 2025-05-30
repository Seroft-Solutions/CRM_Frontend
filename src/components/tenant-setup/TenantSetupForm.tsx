'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Loader2, 
  Clock, 
  Banknote, 
  Factory, 
  Database,
  MapPin,
  CheckCircle2,
  Info
} from 'lucide-react';
import { TenantSetupRequestDTO } from '@/core/api/generated/spring/schemas';

interface TenantSetupFormProps {
  organizationName: string;
  onSetupRequest: (request: Partial<TenantSetupRequestDTO>) => void;
  onStartSetup: () => void;
  isLoading?: boolean;
}

// Industry options relevant for Indian market
const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology & Software' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'healthcare', label: 'Healthcare & Pharmaceuticals' },
  { value: 'education', label: 'Education & Training' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'consulting', label: 'Consulting & Professional Services' },
  { value: 'agriculture', label: 'Agriculture & Food Processing' },
  { value: 'textiles', label: 'Textiles & Apparel' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'logistics', label: 'Logistics & Transportation' },
  { value: 'hospitality', label: 'Hospitality & Tourism' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'other', label: 'Other' },
];

export function TenantSetupForm({
  organizationName,
  onSetupRequest,
  onStartSetup,
  isLoading = false
}: TenantSetupFormProps) {
  const [industry, setIndustry] = useState<string>('');
  const [createSampleData, setCreateSampleData] = useState(false);

  // Handle form submission
  const handleSubmit = () => {
    const setupRequest: Partial<TenantSetupRequestDTO> = {
      tenantName: organizationName,
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en',
      industry: industry || undefined,
      createSampleData,
    };

    onSetupRequest(setupRequest);
    onStartSetup();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to CRM Cup!
        </h1>
        <p className="text-lg text-muted-foreground">
          Let&apos;s set up <span className="font-semibold text-foreground">{organizationName}</span> in just a few steps
        </p>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Organization Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              Organization Details
            </CardTitle>
            <CardDescription>Your workspace configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                Organization
              </Label>
              <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                <span className="font-medium">{organizationName}</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  Ready
                </Badge>
              </div>
            </div>

            {/* Region & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                  Region
                </Label>
                <div className="p-3 bg-muted rounded-md flex items-center">
                  <span className="mr-2">🇮🇳</span>
                  <span className="text-sm font-medium">India</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Banknote className="w-4 h-4 mr-1 text-green-600" />
                  Currency
                </Label>
                <div className="p-3 bg-muted rounded-md flex items-center">
                  <span className="mr-2">₹</span>
                  <span className="text-sm font-medium">INR</span>
                </div>
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-1 text-blue-600" />
                Timezone
              </Label>
              <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                <span className="text-sm font-medium">Asia/Kolkata (IST)</span>
                <Badge variant="outline" className="text-xs">UTC+05:30</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customization Options Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Factory className="w-5 h-5 mr-2 text-primary" />
              Customization
            </CardTitle>
            <CardDescription>Personalize your CRM experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Industry Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Industry (Optional)</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Helps us customize call types and workflows
              </p>
            </div>

            {/* Sample Data Option */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                <Database className="w-4 h-4 mr-1 text-primary" />
                Sample Data
              </Label>
              <div className="flex items-start space-x-3 p-4 border rounded-md">
                <Checkbox
                  id="sample-data"
                  checked={createSampleData}
                  onCheckedChange={(checked) => setCreateSampleData(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="sample-data"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Include sample customers and calls
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add demo data to explore features (can be deleted anytime)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Process Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">What happens during setup?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Create secure database workspace
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Set up priorities and call types
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Configure Indian geographic data
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Apply organization settings
                </div>
                {createSampleData && (
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    Add sample data for exploration
                  </div>
                )}
              </div>
              <div className="flex items-center mt-3 text-sm font-medium text-primary">
                <Clock className="w-4 h-4 mr-1" />
                Usually completes in 30-60 seconds
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up workspace...
            </>
          ) : (
            'Start Setup'
          )}
        </Button>
      </div>
    </div>
  );
}
