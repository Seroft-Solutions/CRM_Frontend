'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { Session } from 'next-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Save, User } from 'lucide-react';
import { useUserProfileUpdate } from '../hooks/useUserProfileUpdate';

const basicInfoSchema = z.object({
  firstName: z
    .string({ message: 'Please enter your first name' })
    .min(1, { message: 'First name is required' })
    .min(2, { message: 'First name must be at least 2 characters' })
    .max(50, { message: 'First name must not exceed 50 characters' }),
  lastName: z
    .string({ message: 'Please enter your last name' })
    .min(1, { message: 'Last name is required' })
    .min(2, { message: 'Last name must be at least 2 characters' })
    .max(50, { message: 'Last name must not exceed 50 characters' }),
  email: z
    .string({ message: 'Please enter your email' })
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  displayName: z
    .string()
    .max(200, { message: 'Display name must not exceed 200 characters' })
    .optional(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoUpdateFormProps {
  session: Session;
}

export function BasicInfoUpdateForm({ session }: BasicInfoUpdateFormProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { updateBasicInfo, isUpdatingBasicInfo, error, clearError } = useUserProfileUpdate();

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      displayName: '',
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const nameParts = session.user?.name?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        form.reset({
          firstName,
          lastName,
          email: session.user?.email || '',
          displayName: session.user?.name || '',
        });
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Failed to load user information');
      } finally {
        setIsInitializing(false);
      }
    };

    if (session?.user) {
      initializeForm();
    }
  }, [session, form]);

  const onSubmit = async (data: BasicInfoFormValues) => {
    if (!session?.user?.id) {
      toast.error('User session not found');
      return;
    }

    const success = await updateBasicInfo({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      displayName: data.displayName,
    });

    if (success) {
    }
  };

  if (isInitializing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading profile information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Update your basic profile information. Changes will be reflected across the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your first name"
                        {...field}
                        disabled={isUpdatingBasicInfo}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your last name"
                        {...field}
                        disabled={isUpdatingBasicInfo}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      {...field}
                      disabled={isUpdatingBasicInfo}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your display name"
                      {...field}
                      disabled={isUpdatingBasicInfo}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isUpdatingBasicInfo}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isUpdatingBasicInfo}>
                {isUpdatingBasicInfo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
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
