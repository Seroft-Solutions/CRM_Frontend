'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  HandCoins,
  Plus,
  ShoppingBag,
  ShoppingCart,
  type LucideIcon,
  UserCircle,
  Users,
} from 'lucide-react';
import Link from 'next/link';

type QuickActionTilesProps = {
  showAddProduct?: boolean;
};

type TileAction = 'add' | 'view';

type QuickActionTile = {
  key: string;
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: TileAction;
  patternPosition: string;
};

type QuickActionPair = {
  key: string;
  add: QuickActionTile;
  manage: QuickActionTile;
};

const quickActionPairs: QuickActionPair[] = [
  {
    key: 'lead',
    add: {
      key: 'add-lead',
      href: '/calls/new',
      title: 'Add Lead',
      description: 'Capture prospect details',
      icon: Plus,
      action: 'add',
      patternPosition: '20% 20%',
    },
    manage: {
      key: 'manage-leads',
      href: '/calls',
      title: 'Manage Leads',
      description: 'View and manage leads',
      icon: Users,
      action: 'view',
      patternPosition: '80% 80%',
    },
  },
  {
    key: 'customer',
    add: {
      key: 'add-customer',
      href: '/customers/new',
      title: 'Add Customer',
      description: 'Register a new customer',
      icon: Plus,
      action: 'add',
      patternPosition: '20% 20%',
    },
    manage: {
      key: 'manage-customers',
      href: '/customers',
      title: 'Manage Customers',
      description: 'View customer database',
      icon: UserCircle,
      action: 'view',
      patternPosition: '20% 80%',
    },
  },
  {
    key: 'product',
    add: {
      key: 'add-product',
      href: '/products/new',
      title: 'Add Product',
      description: 'Add a new product',
      icon: Plus,
      action: 'add',
      patternPosition: '35% 18%',
    },
    manage: {
      key: 'manage-products',
      href: '/products',
      title: 'Manage Products',
      description: 'View product catalog',
      icon: ShoppingCart,
      action: 'view',
      patternPosition: '80% 20%',
    },
  },
  {
    key: 'sale-order',
    add: {
      key: 'add-sale-order',
      href: '/orders/new',
      title: 'Add Sale Order',
      description: 'Create a new sale order',
      icon: Plus,
      action: 'add',
      patternPosition: '70% 20%',
    },
    manage: {
      key: 'manage-sale-orders',
      href: '/orders',
      title: 'Manage Sale Orders',
      description: 'View and manage sales',
      icon: HandCoins,
      action: 'view',
      patternPosition: '85% 35%',
    },
  },
  {
    key: 'purchase-order',
    add: {
      key: 'add-purchase-order',
      href: '/purchase-orders/new',
      title: 'Add Purchase Order',
      description: 'Create a new purchase order',
      icon: Plus,
      action: 'add',
      patternPosition: '25% 65%',
    },
    manage: {
      key: 'manage-purchase-orders',
      href: '/purchase-orders',
      title: 'Manage Purchase Orders',
      description: 'Track purchase order flow',
      icon: ShoppingBag,
      action: 'view',
      patternPosition: '70% 75%',
    },
  },
];

function QuickActionTileCard({ tile }: { tile: QuickActionTile }) {
  const Icon = tile.icon;
  const isAddTile = tile.action === 'add';
  const actionLabel = tile.action === 'add' ? 'Add' : 'View';

  return (
    <Link href={tile.href} className="block">
      <Card
        className="relative h-full min-h-[72px] cursor-pointer overflow-hidden border-0 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
        style={{
          backgroundColor: isAddTile ? 'var(--feature-header-accent)' : 'var(--sidebar)',
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at ${tile.patternPosition}, white 0.5px, transparent 0.5px)`,
              backgroundSize: '18px 18px',
            }}
          />
        </div>

        <CardContent className="relative flex h-full items-center p-2.5">
          <div className="flex w-full items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border backdrop-blur-sm ${
                isAddTile ? 'bg-black/10 border-black/15' : 'bg-white/20 border-white/30'
              }`}
            >
              <Icon className={`h-4 w-4 ${isAddTile ? 'text-slate-900' : 'text-white'}`} />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                className={`truncate text-sm font-semibold ${
                  isAddTile ? 'text-slate-900' : 'text-white'
                }`}
              >
                {tile.title}
              </h3>
              <p
                className={`truncate text-[11px] ${isAddTile ? 'text-slate-800' : 'text-blue-100'}`}
              >
                {tile.description}
              </p>
            </div>

            <div
              className={`flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-medium ${
                isAddTile ? 'bg-white text-slate-900' : 'bg-white text-blue-700'
              }`}
            >
              {tile.action === 'add' ? (
                <Plus className="mr-1 h-3 w-3" />
              ) : (
                <Icon className="mr-1 h-3 w-3" />
              )}
              {actionLabel}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function QuickActionTiles({ showAddProduct = true }: QuickActionTilesProps) {
  const pairs = showAddProduct
    ? quickActionPairs
    : quickActionPairs.filter((pair) => pair.key !== 'product');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {pairs.map((pair) => (
          <QuickActionTileCard key={pair.add.key} tile={pair.add} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {pairs.map((pair) => (
          <QuickActionTileCard key={pair.manage.key} tile={pair.manage} />
        ))}
      </div>
    </div>
  );
}
