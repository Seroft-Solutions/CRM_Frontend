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
      { key: 'users', label: 'Users', path: '/user-management' },
    ],
  },
  {
    key: 'businessPartners',
    label: 'Business Partners',
    icon: Briefcase,
    children: [
      { key: 'registerPartner', label: 'Register Partner', path: '/business-partners' },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    icon: Settings,
    children: [
      { key: 'callType', label: 'Call Type Master', path: '/masters/call-type' },
      { key: 'subCallType', label: 'Sub Call Type Master', path: '/masters/sub-call-type' },
      { key: 'callCategory', label: 'Call Category Master', path: '/masters/call-category' },
      { key: 'callStatus', label: 'Call Status Master', path: '/masters/call-status' },
      { key: 'priority', label: 'Priority Master', path: '/masters/priority' },
      { key: 'source', label: 'Source Master', path: '/masters/source' },
      { key: 'city', label: 'City Master', path: '/masters/city' },
      { key: 'channelType', label: 'Channel Type Master', path: '/masters/channel-type' },
      { key: 'party', label: 'Party Master', path: '/masters/party' },
      { key: 'product', label: 'Product Master', path: '/masters/product' },
    ],
  },
  {
    key: 'calls',
    label: 'Calls Management',
    icon: PhoneCall,
    children: [
      { key: 'callTracking', label: 'Call Tracking', path: '/call-tracking' },
    ],
  },
];
