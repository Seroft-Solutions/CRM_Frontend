import {
    LayoutDashboard,
    Users,
    Briefcase,
    Settings,
    PhoneCall,
    Map,
} from "lucide-react";
import {type LucideIcon} from "lucide-react";

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
    {key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard},
    {
        key: 'userManagement',
        label: 'User Management',
        icon: Users,
        expandable: true,
        requiredPermission: 'user:read',
        children: [
            {
                key: 'organizationUsers',
                label: 'Organization Users',
                path: '/user-management/organization-users',
                requiredPermission: 'user:read'
            },
            {
                key: 'inviteUsers',
                label: 'Invite Users',
                path: '/user-management/invite-users',
                requiredPermission: 'user:create'
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
                requiredPermission: 'partner:create'
            },
            {
                key: 'managePartner',
                label: 'Manage Partners',
                path: '/business-partners',
                requiredPermission: 'partner:read'
            },
        ],
    },
    {
        key: 'geography',
        label: 'Geography',
        icon: Map,
        expandable: false,
        requiredPermission: 'geography:read',
        children: [
            {key: 'states', label: 'States Master', path: '/states', requiredPermission: 'state:read'},
            {key: 'districts', label: 'Districts Master', path: '/districts', requiredPermission: 'district:read'},
            {key: 'city', label: 'City Master', path: '/cities', requiredPermission: 'city:read'},
            {key: 'areas', label: 'Areas Master', path: '/areas', requiredPermission: 'area:read'},
        ],
    },
    {
        key: 'masters',
        label: 'Masters',
        icon: Settings,
        expandable: true,
        children: [
            {key: 'callType', label: 'Call Type Master', path: '/call-types', requiredPermission: 'callType:read'},
            {
                key: 'subCallType',
                label: 'Sub Call Type Master',
                path: '/sub-call-types',
                requiredPermission: 'subCallType:read'
            },
            {
                key: 'callCategory',
                label: 'Call Category Master',
                path: '/call-categories',
                requiredPermission: 'callCategory:read'
            },
            {
                key: 'callStatus',
                label: 'Call Status Master',
                path: '/call-statuses',
                requiredPermission: 'callStatus:read'
            },
            {key: 'priority', label: 'Priority Master', path: '/priorities', requiredPermission: 'priority:read'},
            {key: 'source', label: 'Source Master', path: '/sources', requiredPermission: 'source:read'},
            {
                key: 'channelType',
                label: 'Channel Type Master',
                path: '/channel-types',
                requiredPermission: 'channelType:read'
            },
            {key: 'party', label: 'Party Master', path: '/parties', requiredPermission: 'party:read'},
            {key: 'product', label: 'Product Master', path: '/products', requiredPermission: 'product:read'},
        ],
    },
    {
        key: 'calls',
        label: 'Calls Management',
        icon: PhoneCall,
        expandable: true,
        requiredPermission: 'call:read',
        children: [
            {key: 'callTracking', label: 'Call Tracking', path: '/calls', requiredPermission: 'call:read'},
            {key: 'callRemarks', label: 'Call Remarks', path: '/call-remarks', requiredPermission: 'callRemark:read'},
        ],
    },
];
