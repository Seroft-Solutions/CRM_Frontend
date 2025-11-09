'use client';
import React, { useState, useEffect } from 'react';
import { FormField, FormLabel } from '@/components/ui/form';

import { Plus, MessageSquare, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CallRemark } from '@/app/(protected)/(features)/calls/hooks/use-call-remarks';
import { RelationshipRenderer } from '../relationship-renderer';
interface CallRemarksStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CallRemarksStep({ form, config, actions }: CallRemarksStepProps) {
  return <></>;
}
