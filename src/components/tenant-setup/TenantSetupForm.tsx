'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, Info } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Organization Info */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Building2 className="w-5 h-5 mr-2" />
            Organization Details
          </CardTitle>
          <CardDescription>
            We&apos;ll set up your CRM workspace with these details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Organization Name</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                <span className="font-medium">{organizationName}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Region</Label>
              <div className="mt-1 p-2 bg-muted rounded-md flex items-center">
                <span>India</span>
                <Badge variant="secondary" className="ml-2">🇮🇳</Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Timezone</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                <span>Asia/Kolkata (IST)</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Currency</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                <span>Indian Rupee (₹)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Industry (Optional)</CardTitle>
          <CardDescription>
            Help us customize your CRM experience by selecting your industry.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Sample Data Option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Initial Data</CardTitle>
          <CardDescription>
            Choose whether to include sample data to help you get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="sample-data"
              checked={createSampleData}
              onCheckedChange={setCreateSampleData}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="sample-data"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include sample data
              </Label>
              <p className="text-xs text-muted-foreground">
                Add sample customers, calls, and products to help you explore the system.
                You can delete this data anytime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Information */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                What happens during setup?
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Create your organization&apos;s secure workspace</li>
                <li>• Set up default priorities, statuses, and call types</li>
                <li>• Configure Indian states, districts, and cities data</li>
                <li>• Apply your organization preferences</li>
                {createSampleData && <li>• Add sample data for exploration</li>}
              </ul>
              <p className="text-xs text-blue-600 font-medium">
                This usually takes 30-60 seconds to complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          size="lg"
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            'Start Setup'
          )}
        </Button>
      </div>
    </div>
  );
}
