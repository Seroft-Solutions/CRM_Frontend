/**
 * Example Server-Side Usage
 * Demonstrates proper Spring Auth implementation patterns for server components and API routes
 */

import { auth, getUserRoles, hasRole, getUserData } from '@/core/auth';
import { NextRequest, NextResponse } from 'next/server';

// Example 1: Server Component with Role Checking
export async function UserManagementPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Please log in to access this page</div>;
  }

  const userRoles = await getUserRoles(session.user.id);
  const canManageUsers = userRoles.includes('users:manage');
  
  if (!canManageUsers) {
    return <div>You don't have permission to manage users</div>;
  }

  return (
    <div>
      <h1>User Management</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Your roles: {userRoles.join(', ')}</p>
      {/* Rest of the component */}
    </div>
  );
}

// Example 2: API Route with Permission Checking
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user has permission to read users
    const hasReadPermission = await hasRole(session.user.id, 'users:read');
    
    if (!hasReadPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' }, 
        { status: 403 }
      );
    }

    // Fetch and return user data
    const users = await fetchUsers(); // Your data fetching logic
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Example 3: API Route with Multiple Permission Checks
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    const userData = await getUserData(session.user.id);
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User profile not found' }, 
        { status: 404 }
      );
    }

    // Check multiple permissions
    const canCreate = userData.roles.includes('users:create');
    const isAdmin = userData.roles.includes('admin');
    
    if (!canCreate && !isAdmin) {
      return NextResponse.json(
        { error: 'You need users:create permission or admin role' }, 
        { status: 403 }
      );
    }

    // Process the request
    const body = await request.json();
    const result = await createUser(body); // Your business logic
    
    return NextResponse.json({ 
      success: true, 
      user: result,
      message: 'User created successfully' 
    });
    
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' }, 
      { status: 500 }
    );
  }
}

// Example 4: Middleware-like Permission Function
export async function requirePermission(permission: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  const hasPermission = await hasRole(session.user.id, permission);
  
  if (!hasPermission) {
    throw new Error(`Permission required: ${permission}`);
  }

  return {
    user: session.user,
    userData: await getUserData(session.user.id),
  };
}

// Example 5: Using the Permission Function
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require delete permission
    const { user, userData } = await requirePermission('users:delete');
    
    const userId = params.id;
    
    // Additional business logic
    const result = await deleteUser(userId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully',
      deletedBy: user.id 
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (error.message.includes('Permission required')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    );
  }
}

// Helper functions (would be implemented elsewhere)
async function fetchUsers() {
  // Your data fetching logic
  return [];
}

async function createUser(userData: any) {
  // Your user creation logic
  return { id: '123', ...userData };
}

async function deleteUser(userId: string) {
  // Your user deletion logic
  return { deleted: true, id: userId };
}
