'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock } from 'lucide-react';
import { BasicInfoUpdateForm } from './BasicInfoUpdateForm';
import { PasswordUpdateForm } from './PasswordUpdateForm';

interface UserProfileUpdateProps {
  className?: string;
}

export function UserProfileUpdate({ className = '' }: UserProfileUpdateProps) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('basic-info');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-destructive">Authentication Required</CardTitle>
          <CardDescription>You must be logged in to update your profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic-info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password & Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="space-y-4">
          <BasicInfoUpdateForm session={session} />
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <PasswordUpdateForm session={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
