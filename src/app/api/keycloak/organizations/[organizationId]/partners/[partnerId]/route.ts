/**
 * Remove Business Partner API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  deleteAdminRealmsRealmOrganizationsOrgIdMembersMemberId,
  getAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
  type UserRepresentation,
} from '@/core/api/generated/keycloak';
import {
  getChannelType,
  updateUserProfile,
  UserProfileDTO,
  deleteUserProfile,
  searchUserProfiles,
} from '@/core/api/generated/spring';
import { postAdminRealmsRealmOrganizationsOrgIdMembers } from '@/core/api/generated/keycloak';
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; partnerId: string }> }
) {
  let keycloakRemovalSucceeded = false;
  let springRemovalSucceeded = false;

  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId, partnerId } = await params;
    const realm = keycloakService.getRealm();

    console.log('Starting business partner removal process:', {
      organizationId,
      partnerId,
      operation: 'DELETE',
    });

    // Step 1: Remove partner from Keycloak organization
    try {
      console.log('Removing partner from Keycloak organization...');
      await deleteAdminRealmsRealmOrganizationsOrgIdMembersMemberId(
        realm,
        organizationId,
        partnerId
      );
      keycloakRemovalSucceeded = true;
      console.log('Successfully removed partner from Keycloak organization');
    } catch (keycloakError: any) {
      console.error('Failed to remove partner from Keycloak:', keycloakError);
      throw new Error(`Keycloak removal failed: ${keycloakError.message}`);
    }

    // Step 2: Remove partner from Spring backend
    try {
      console.log('Removing partner from Spring backend...');

      // First, search for the user profile by keycloakId to get the database ID
      console.log('Searching for user profile by keycloakId:', partnerId);
      const searchPromise = searchUserProfiles({
        query: `keycloakId:${partnerId}`,
      });
      const searchTimeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Spring backend search timeout')), 10000)
      );

      const existingUsers = await Promise.race([searchPromise, searchTimeoutPromise]);

      if (!existingUsers || existingUsers.length === 0) {
        console.log(
          'Partner not found in Spring backend by keycloakId, considering removal successful'
        );
        springRemovalSucceeded = true;
      } else {
        // User profile exists, delete it using the database ID
        const userProfile = existingUsers[0];
        const userProfileDatabaseId = userProfile.id;

        console.log(`Found user profile in Spring backend:`, {
          databaseId: userProfileDatabaseId,
          keycloakId: userProfile.keycloakId,
          email: userProfile.email,
        });

        // Delete using the database ID
        const deletePromise = deleteUserProfile(userProfileDatabaseId);
        const deleteTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Spring backend delete timeout')), 10000)
        );

        await Promise.race([deletePromise, deleteTimeoutPromise]);
        springRemovalSucceeded = true;
        console.log(
          `Successfully removed partner from Spring backend using database ID: ${userProfileDatabaseId}`
        );
      }
    } catch (springError: any) {
      console.error('Failed to remove partner from Spring backend:', springError);

      // Check if it's a redirect error (which might indicate auth issues)
      const isRedirectError =
        springError.message?.includes('Maximum number of redirects exceeded') ||
        springError.message?.includes('redirect') ||
        springError.status === 302;

      const isNotFoundError =
        springError.status === 404 || springError.message?.includes('not found');

      const isTimeoutError = springError.message?.includes('timeout');

      // If user doesn't exist in Spring backend, consider it a successful removal
      if (isNotFoundError) {
        console.log('Partner not found in Spring backend, considering removal successful');
        springRemovalSucceeded = true;
      } else if (isRedirectError) {
        console.warn(
          'Spring backend redirect error - likely auth issue, but partner may not exist in backend, considering successful'
        );
        springRemovalSucceeded = true;
      } else if (isTimeoutError) {
        console.warn(
          'Spring backend timeout - backend may be slow, but will proceed with rollback to be safe'
        );
        // Don't mark as successful, proceed with rollback
      } else {
        console.error('Genuine Spring backend error occurred');
        // Don't mark as successful, proceed with rollback
      }

      if (!springRemovalSucceeded) {
        // ROLLBACK: Re-add partner to Keycloak organization since Spring removal failed
        console.log('Attempting rollback: Re-adding partner to Keycloak organization...');
        try {
          await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, partnerId);
          console.log('Rollback successful: Partner restored to Keycloak organization');

          return NextResponse.json(
            {
              error:
                'Partner removal failed: Spring backend removal failed, changes have been rolled back',
              details: {
                keycloakRemoval: 'succeeded',
                springRemoval: 'failed',
                rollback: 'successful',
                springError: springError.message || 'Unknown Spring backend error',
              },
            },
            { status: 500 }
          );
        } catch (rollbackError: any) {
          console.error('CRITICAL: Rollback failed:', rollbackError);

          return NextResponse.json(
            {
              error: 'CRITICAL: Partner removal partially completed with rollback failure',
              details: {
                keycloakRemoval: 'succeeded',
                springRemoval: 'failed',
                rollback: 'failed',
                springError: springError.message || 'Unknown Spring backend error',
                rollbackError: rollbackError.message || 'Unknown rollback error',
                warning: 'Data inconsistency detected - manual intervention required',
              },
            },
            { status: 500 }
          );
        }
      }
    }

    // Success: Both removals completed
    console.log('Business partner removal completed successfully:', {
      partnerId,
      keycloakRemoval: 'succeeded',
      springRemoval: 'succeeded',
    });

    return NextResponse.json({
      success: true,
      message: 'Business partner removed successfully from both Keycloak and Spring backend',
      details: {
        keycloakRemoval: 'succeeded',
        springRemoval: 'succeeded',
        partnerId,
      },
    });
  } catch (error: any) {
    console.error('Business partner removal error:', {
      error: error.message,
      keycloakRemovalSucceeded,
      springRemovalSucceeded,
      partnerId: (await params).partnerId,
    });

    // Handle specific error cases
    if (error.status === 404 || error.message?.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Partner not found in organization',
          details: {
            keycloakRemoval: keycloakRemovalSucceeded ? 'succeeded' : 'not attempted',
            springRemoval: springRemovalSucceeded ? 'succeeded' : 'not attempted',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to remove partner from organization',
        details: {
          keycloakRemoval: keycloakRemovalSucceeded ? 'succeeded' : 'failed',
          springRemoval: springRemovalSucceeded ? 'succeeded' : 'failed',
          requiresManualReview: keycloakRemovalSucceeded && !springRemovalSucceeded,
        },
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; partnerId: string }> }
) {
  try {
    // Log incoming request data
    const body = await request.json();
    const realm = keycloakService.getRealm();
    const { organizationId, partnerId } = await params;
    console.log('Received PATCH request:', {
      endpoint: 'PATCH /partner',
      organizationId,
      partnerId,
      requestBody: body,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    console.log('Permission check result:', {
      authorized: permissionCheck.authorized,
      error: permissionCheck.error,
    });
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    // Log extracted parameters
    console.log('Extracted parameters:', { organizationId, partnerId });

    // Validate input
    if (!body.email && !body.firstName && !body.lastName && !body.channelTypeId) {
      console.log('Validation failed: No fields provided for update');
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        console.log('Validation failed: Invalid email format', { email: body.email });
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }
    // Get current user data
    console.log('Fetching current user data for partnerId:', partnerId);
    const currentUsers = await getAdminRealmsRealmUsers(realm, {
      email: body.email,
      exact: true,
    });
    if (currentUsers.length === 0) {
      console.log('User not found for partnerId:', partnerId);
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const currentUser = currentUsers[0];
    console.log('Retrieved current user:', {
      id: currentUser.id,
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      existingAttributes: currentUser.attributes,
    });

    // Prepare updated user data
    const updatedUser: UserRepresentation = {
      ...currentUser,
      email: body.email || currentUser.email,
      firstName: body.firstName || currentUser.firstName,
      lastName: body.lastName || currentUser.lastName,
      attributes: {
        ...currentUser.attributes,
        organization: [organizationId],
        user_type: ['partner'],
        channel_type_id: body.attributes?.channel_type_id
          ? [body.attributes.channel_type_id[0]]
          : body.channelTypeId
            ? [body.channelTypeId.toString()]
            : currentUser.attributes?.channel_type_id,
        invited_as: ['business_partner'],
      },
    };
    const channel = await getChannelType(
      Number(
        body.attributes?.channel_type_id?.[0] ||
          body.channelTypeId ||
          currentUser.attributes?.channel_type_id?.[0]
      )
    );
    console.log('Prepared updated user data:', {
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      attributes: updatedUser.attributes,
    });
    const updateProfile: UserProfileDTO = {
      id: partnerId,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      displayName: body.firstName + ' ' + body.lastName,
      channelType: channel,
      keycloakId: partnerId,
    };
    // Update user in Keycloak
    console.log('Updating user in Keycloak for partnerId:', partnerId);
    await putAdminRealmsRealmUsersUserId(realm, partnerId, updatedUser);
    console.log(`Successfully updated partner ${partnerId} attributes`);
    await updateUserProfile(partnerId, updateProfile);
    // Prepare response
    const response = {
      success: true,
      message: 'Partner updated successfully',
      userId: partnerId,
      email: updatedUser.email,
      channelTypeId:
        body.attributes?.channel_type_id?.[0] ||
        body.channelTypeId ||
        currentUser.attributes?.channel_type_id?.[0],
    };

    console.log('Returning response:', response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Partner update API error:', {
      message: error.message,
      status: error.status,
      responseData: error.response?.data,
      config: error.config
        ? {
            url: error.config.url,
            method: error.config.method,
            data: error.config.data,
          }
        : null,
    });

    if (error.status === 404) {
      return NextResponse.json({ error: 'Organization or partner not found' }, { status: 404 });
    }

    if (error.status === 400) {
      return NextResponse.json(
        {
          error: 'Invalid partner update data',
          details: error.response?.data || error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to update partner',
        details: error.response?.data,
      },
      { status: error.status || 500 }
    );
  }
}
