import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  PhoneCall,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

// Define the type for sidebar items
export type SidebarItem = {
  key: string;
  label: string;
  path?: string;
  icon?: LucideIcon;
  isActive?: boolean;
  children?: SidebarItem[];
};

// Main sidebar items
export const sidebarItems: SidebarItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    key: 'userManagement',
    label: 'User Management',
    icon: Users,
    children: [
      { key: 'organizationUsers', label: 'Organization Users', path: '/user-management/organization-users' },
      { key: 'inviteUsers', label: 'Invite Users', path: '/user-management/invite-users' },
    ],
  },
  {
    key: 'businessPartners',
    label: 'Business Partners',
    icon: Briefcase,
    children: [
      { key: 'invitePartner', label: 'Invite Partner', path: '/invite-partners' },
      { key: 'managePartner', label: 'Manage Partners', path: '/business-partners' },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    icon: Settings,
    children: [
      { key: 'callType', label: 'Call Type Master', path: '/call-types' },
      { key: 'subCallType', label: 'Sub Call Type Master', path: '/sub-call-types' },
      { key: 'callCategory', label: 'Call Category Master', path: '/call-categories' },
      { key: 'callStatus', label: 'Call Status Master', path: '/call-statuses' },
      { key: 'priority', label: 'Priority Master', path: '/priorities' },
      { key: 'source', label: 'Source Master', path: '/sources' },
      { key: 'states', label: 'States Master', path: '/states' },
      { key: 'districts', label: 'Districts Master', path: '/districts' },
      { key: 'city', label: 'City Master', path: '/cities' },
      { key: 'areas', label: 'Areas Master', path: '/areas' },
      { key: 'channelType', label: 'Channel Type Master', path: '/channel-types' },
      { key: 'party', label: 'Party Master', path: '/parties' },
      { key: 'product', label: 'Product Master', path: '/products' },
    ],
  },
  {
    key: 'calls',
    label: 'Calls Management',
    icon: PhoneCall,
    children: [
      { key: 'callTracking', label: 'Call Tracking', path: '/calls' },
    ],
  },
];
