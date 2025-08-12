import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  PhoneCall,
  Map,
  FileText,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

// Define the type for sidebar items
export type SidebarItem = {
  key: string;
  label: string;
  path?: string;
  icon?: LucideIcon;
  isActive?: boolean;
  expandable?: boolean; // Controls if section is expanded by default
  requiredPermission?: string; // Permission required to view this item
  children?: SidebarItem[];
};

// Main sidebar items
export const sidebarItems: SidebarItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: 'dashboard',
  },
  { key: 'drafts', label: 'My Drafts', path: '/drafts', icon: FileText },
  {
    key: 'userManagement',
    label: 'User Management',
    icon: Users,
    expandable: true,
    requiredPermission: 'manage:users',
    children: [
      {
        key: 'organizationUsers',
        label: 'Organization Users',
        path: '/user-management/organization-users',
        requiredPermission: 'manage:users',
      },
      {
        key: 'inviteUsers',
        label: 'Invite Users',
        path: '/user-management/invite-users',
        requiredPermission: 'manage:users',
      },
    ],
  },
  {
    key: 'businessPartners',
    label: 'Business Partners',
    icon: Briefcase,
    expandable: true,
    requiredPermission: 'partner:read',
    children: [
      {
        key: 'invitePartner',
        label: 'Invite Partner',
        path: '/invite-partners',
        requiredPermission: 'partner:create',
      },
      {
        key: 'managePartner',
        label: 'Manage Partners',
        path: '/business-partners',
        requiredPermission: 'partner:read',
      },
    ],
  },
  {
    key: 'geography',
    label: 'Geography',
    icon: Map,
    expandable: false,
    requiredPermission: 'geography:sidebar',
    children: [
      {
        key: 'states',
        label: 'States Master',
        path: '/states',
        requiredPermission: 'state:sidebar',
      },
      {
        key: 'districts',
        label: 'Districts Master',
        path: '/districts',
        requiredPermission: 'district:sidebar',
      },
      { key: 'city', label: 'City Master', path: '/cities', requiredPermission: 'city:sidebar' },
      { key: 'areas', label: 'Areas Master', path: '/areas', requiredPermission: 'area:sidebar' },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    icon: Settings,
    expandable: true,
    children: [
      {
        key: 'callType',
        label: 'Call Type Master',
        path: '/call-types',
        requiredPermission: 'callType:sidebar',
      },
      {
        key: 'subCallType',
        label: 'Sub Call Type Master',
        path: '/sub-call-types',
        requiredPermission: 'subCallType:sidebar',
      },
      {
        key: 'callStatus',
        label: 'Call Status Master',
        path: '/call-statuses',
        requiredPermission: 'callStatus:sidebar',
      },
      {
        key: 'priority',
        label: 'Priority Master',
        path: '/priorities',
        requiredPermission: 'priority:sidebar',
      },
      {
        key: 'source',
        label: 'Source Master',
        path: '/sources',
        requiredPermission: 'source:sidebar',
      },
      {
        key: 'channelType',
        label: 'Channel Type Master',
        path: '/channel-types',
        requiredPermission: 'channelType:sidebar',
      },
      {
        key: 'customer',
        label: 'Customer Master',
        path: '/customers',
        requiredPermission: 'customer:sidebar',
      },
      {
        key: 'product',
        label: 'Product Master',
        path: '/products',
        requiredPermission: 'product:sidebar',
      },
    ],
  },
  {
    key: 'calls',
    label: 'Calls Management',
    icon: PhoneCall,
    expandable: true,
    requiredPermission: 'call:sidebar',
    children: [
      {
        key: 'callTracking',
        label: 'Call Tracking',
        path: '/calls',
        requiredPermission: 'call:sidebar',
      },
    ],
  },
];
