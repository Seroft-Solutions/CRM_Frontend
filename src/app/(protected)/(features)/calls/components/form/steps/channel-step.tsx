'use client';

import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RelationshipRenderer } from '../relationship-renderer';
import { Building2, UserCheck } from 'lucide-react';
import { useEntityForm } from '@/app/(protected)/(features)/calls/components/form/call-form-provider';

interface CallChannelStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CallChannelStep({ form, config, actions, entity }: CallChannelStepProps) {
  return <div className="space-y-6"></div>;
}
