'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { Session } from 'next-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Camera, Loader2, Save, Upload, User } from 'lucide-react';
import { getAcceptString, validateImageFile } from '@/lib/utils/image-validation';
import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';
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
type ProfileWithPicture = UserProfileDTO & { profilePictureUrl?: string | null };

interface BasicInfoUpdateFormProps {
  session: Session;
}

export function BasicInfoUpdateForm({ session }: BasicInfoUpdateFormProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null);
  const {
    updateBasicInfo,
    updateProfilePicture,
    isUpdatingBasicInfo,
    isUpdatingProfilePicture,
    profile,
    keycloakUser,
    refreshProfile,
  } = useUserProfileUpdate();

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
        const sessionFirstName = nameParts[0] || '';
        const sessionLastName = nameParts.slice(1).join(' ') || '';

        form.reset({
          firstName: sessionFirstName,
          lastName: sessionLastName,
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

  useEffect(() => {
    if (session?.user) {
      void refreshProfile();
    }
  }, [refreshProfile, session]);

  useEffect(() => {
    if (!session?.user || isInitializing) {
      return;
    }

    const nameParts = session.user.name?.split(' ') || [];
    const sessionFirstName = nameParts[0] || '';
    const sessionLastName = nameParts.slice(1).join(' ') || '';
    const firstName = profile?.firstName || keycloakUser?.firstName || sessionFirstName;
    const lastName = profile?.lastName || keycloakUser?.lastName || sessionLastName;
    const email = profile?.email || keycloakUser?.email || session.user.email || '';
    const displayName =
      profile?.displayName ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      session.user.name ||
      '';

    form.reset({
      firstName,
      lastName,
      email,
      displayName,
    });
  }, [profile, keycloakUser, session, isInitializing, form]);

  useEffect(() => {
    return () => {
      if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl);
      }
    };
  }, [profileImagePreviewUrl]);

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

    void success;
  };

  const handleProfileImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = await validateImageFile(file);

    if (!validation.valid) {
      toast.error(validation.errors[0]?.message || 'Invalid image file');
      event.target.value = '';

      return;
    }

    if (validation.warnings.length > 0) {
      toast.warning(validation.warnings[0]?.message || 'Image selected');
    }

    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
    }

    setSelectedProfileImage(file);
    setProfileImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedProfileImage) {
      toast.error('Please select an image first');

      return;
    }

    const success = await updateProfilePicture(selectedProfileImage);

    if (!success) {
      return;
    }

    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl);
    }
    setProfileImagePreviewUrl(null);
    setSelectedProfileImage(null);
  };

  const currentProfileImage =
    profileImagePreviewUrl ||
    ((profile as ProfileWithPicture | null)?.profilePictureUrl ?? '') ||
    keycloakUser?.attributes?.avatar?.[0] ||
    keycloakUser?.attributes?.picture?.[0] ||
    session.user?.image ||
    '';
  const profileInitials = session.user?.name?.trim().charAt(0)?.toUpperCase() || 'U';

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
        <div className="rounded-lg border p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 border">
              {currentProfileImage ? (
                <AvatarImage src={currentProfileImage} alt="Profile picture" />
              ) : null}
              <AvatarFallback className="text-xl">{profileInitials}</AvatarFallback>
            </Avatar>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-xs text-muted-foreground">
                  Upload JPG, PNG, or WEBP up to 5 MB.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="profile-picture-input"
                  type="file"
                  accept={getAcceptString()}
                  className="hidden"
                  onChange={handleProfileImageSelection}
                  disabled={isUpdatingProfilePicture}
                />
                <label
                  htmlFor="profile-picture-input"
                  className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Choose Photo
                </label>

                <Button
                  type="button"
                  onClick={handleUploadProfilePicture}
                  disabled={!selectedProfileImage || isUpdatingProfilePicture}
                >
                  {isUpdatingProfilePicture ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

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
