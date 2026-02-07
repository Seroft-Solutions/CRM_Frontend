import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  PhoneCall,
  Box,
  HandCoins,
  Cog,
  ShoppingBag,
  BadgePercent,
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
    key: 'discount',
    label: 'Discount',
    path: '/discounts',
    icon: BadgePercent,
    requiredPermission: 'discount:sidebar',
    expandable: false,
  },
  {
    key: 'salesOrders',
    label: 'Sale Order',
    icon: HandCoins,
    expandable: false,
    requiredPermission: 'order:sidebar',
    children: [
      {
        key: 'ordersList',
        label: 'View Sale Orders',
        path: '/orders',
        requiredPermission: 'order:read',
      },
      {
        key: 'createOrder',
        label: 'Create Sale Order',
        path: '/orders/new',
        requiredPermission: 'order:create',
      },
      {
        key: 'orderHistory',
        label: 'Sale Order History',
        path: '/orders/history',
        requiredPermission: 'order:read',
      },
    ],
  },
  {
    key: 'purchaseOrders',
    label: 'Purchase Orders',
    icon: ShoppingBag,
    expandable: false,
    requiredPermission: 'purchase-order:read',
    children: [
      {
        key: 'purchaseOrdersList',
        label: 'View Purchase Orders',
        path: '/purchase-orders',
        requiredPermission: 'purchase-order:read',
      },
      {
        key: 'createPurchaseOrder',
        label: 'Create Purchase Order',
        path: '/purchase-orders/new',
        requiredPermission: 'purchase-order:create',
      },
      {
        key: 'purchaseOrderHistory',
        label: 'Purchase Order History',
        path: '/purchase-orders/history',
        requiredPermission: 'purchase-order:read',
      },
    ],
  },
  {
    key: 'userManagement',
    label: 'My Staff',
    icon: Users,
    expandable: false,
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

      { key: 'areas', label: 'Areas Master', path: '/areas', requiredPermission: 'area:sidebar' },
    ],
  },
  {
    key: 'CustomerManagement',
    label: 'Customers Management',
    icon: Users,
    expandable: false,
    requiredPermission: 'customer:sidebar',
    children: [
      {
        key: 'viewCustomers',
        label: 'View Customers',
        path: '/customers',
        requiredPermission: 'customer:sidebar',
      },
      {
        key: 'createCustomer',
        label: 'Create Customer',
        path: '/customers/new',
        requiredPermission: 'customer:create',
      },
      {
        key: 'importCustomers',
        label: 'Import Customers',
        path: '/customers/import',
        requiredPermission: 'customer:sidebar',
      },
      {
        key: 'importHistory',
        label: 'Import History',
        path: '/customers/import/results',
        requiredPermission: 'customer:sidebar',
      },
    ],
  },
  {
    key: 'SundryCreditorManagement',
    label: 'Sundry Creditors',
    icon: Users,
    expandable: false,
    requiredPermission: 'sundryCreditor:sidebar',
    children: [
      {
        key: 'viewSundryCreditors',
        label: 'View Creditors',
        path: '/sundry-creditors',
        requiredPermission: 'sundryCreditor:sidebar',
      },
      {
        key: 'createSundryCreditor',
        label: 'Create Creditor',
        path: '/sundry-creditors/new',
        requiredPermission: 'sundryCreditor:create',
      },
      {
        key: 'importSundryCreditors',
        label: 'Import Creditors',
        path: '/sundry-creditors/import',
        requiredPermission: 'sundryCreditor:sidebar',
      },
      {
        key: 'importSundryCreditorHistory',
        label: 'Import History',
        path: '/sundry-creditors/import/results',
        requiredPermission: 'sundryCreditor:sidebar',
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
        key: 'productCatalog',
        label: 'Manage Product Catalog',
        path: '/product-catalogs',
        requiredPermission: 'productCatalog:sidebar',
      },
      {
        key: 'createProductCatalog',
        label: 'Create Product Catalog',
        path: '/product-catalogs/new',
        requiredPermission: 'productCatalog:create',
      },
      {
        key: 'product',
        label: 'View Products',
        path: '/products',
        requiredPermission: 'product:sidebar',
      },
      {
        key: 'addProduct',
        label: 'Add Products',
        path: '/products/new',
        requiredPermission: 'product:create',
      },
      {
        key: 'productImport',
        label: 'Import Products',
        path: '/products/import',
        requiredPermission: 'product:create',
      },
      {
        key: 'productImportHistory',
        label: 'Import History',
        path: '/products/import/results',
        requiredPermission: 'product:create',
      },
    ],
  },
  {
    key: 'systemConfiguration',
    label: 'System Configuration',
    icon: Cog,
    expandable: false,
    children: [
      {
        key: 'systemConfig',
        label: 'System Configs',
        path: '/system-configs',
        requiredPermission: 'systemConfig:sidebar',
      },
      {
        key: 'systemConfigAttribute',
        label: 'Config Attributes',
        path: '/system-config-attributes',
        requiredPermission: 'systemConfigAttribute:sidebar',
      },
      {
        key: 'systemConfigAttributeOption',
        label: 'Attribute Options',
        path: '/system-config-attribute-options',
        requiredPermission: 'systemConfigAttributeOption:sidebar',
      },
    ],
  },
];
