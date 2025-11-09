import {
  ArrowDownToLine,
  Box,
  Briefcase,
  LayoutDashboard,
  type LucideIcon,
  PhoneCall,
  Settings,
  Users,
} from 'lucide-react';

export type SidebarItem = {
  key: string;
  label: string;
  path?: string;
  icon?: LucideIcon;
  isActive?: boolean;
  expandable?: boolean;
  requiredPermission?: string;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: 'dashboard',
  },
  {
    key: 'partnerDashboard',
    label: 'Partner Dashboard',
    path: '/business-partner-dashboard',
    icon: LayoutDashboard,
    requiredPermission: 'partner:dashboard',
  },
  {
    key: 'calls',
    label: 'Leads Management',
    icon: PhoneCall,
    expandable: true,
    requiredPermission: 'call:sidebar',
    children: [
      {
        key: 'addCallTracking',
        label: 'Add Lead',
        path: '/calls/new',
        requiredPermission: 'call:create',
      },
      {
        key: 'callTracking',
        label: 'Track Lead',
        path: '/calls',
        requiredPermission: 'call:sidebar',
        children: [
            {
                key: 'addCallTracking',
                label: 'Add Lead',
                path: '/calls/new',
                requiredPermission: 'call:create',
            },
            {
                key: 'callTracking',
                label: 'Track Lead',
                path: '/calls',
                requiredPermission: 'call:sidebar',
            },
            {
                key: 'callImport',
                label: 'Import Leads',
                path: '/calls/import',
            },
            {
                key: 'callImportHistory',
                label: 'Import History',
                path: '/calls/import/results',
            },
        ],
    },
    {
        key: 'userManagement',
        label: 'My Staff',
        icon: Users,
        expandable: false,
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
    expandable: false,
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
        key: 'masters',
        label: 'Masters',
        icon: Settings,
        expandable: false,
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
            {key: 'areas', label: 'Areas Master', path: '/areas', requiredPermission: 'area:sidebar'},
            {
                key: 'customer',
                label: 'Customer Master',
                path: '/customers',
                requiredPermission: 'customer:sidebar',
            },
        ],
    },
    {
        key: 'productManagement',
        label: 'Product Management',
        icon: Box,
        expandable: false,
        children: [
            {
                key: 'productCategory',
                label: 'Product Category',
                path: '/product-categories',
                requiredPermission: 'productCategory:sidebar',
            },
            {
                key: 'productSubCategory',
                label: 'Product Sub Category',
                path: '/product-sub-categories',
                requiredPermission: 'productSubCategory:sidebar',
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
        key: 'import',
        label: 'Bulk Import',
        path: '/import',
        icon: ArrowDownToLine,
    }
];
