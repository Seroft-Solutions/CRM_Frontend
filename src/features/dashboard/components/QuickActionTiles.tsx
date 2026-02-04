'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, ShoppingCart, UserCircle } from 'lucide-react';
import Link from 'next/link';

type QuickActionTilesProps = {
  showAddProduct?: boolean;
};

export function QuickActionTiles({ showAddProduct = true }: QuickActionTilesProps) {
  return (
    <div className="grid gap-4 grid-rows-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Add Lead Tile */}
      <Link href="/calls/new" className="block">
        <Card
          className="relative overflow-hidden border-0 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:brightness-110 group cursor-pointer h-full min-h-[80px]"
          style={{ backgroundColor: 'var(--sidebar)' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/5 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, white 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <CardContent className="relative p-3 h-full flex items-center">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300 flex-shrink-0">
                <Plus className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">New Lead</h3>
                <p className="text-blue-100 text-xs">Capture prospect details</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-blue-600 border-0 font-medium px-3 py-1.5 h-7 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Manage Leads Tile */}
      <Link href="/calls" className="block">
        <Card
          className="relative overflow-hidden border-0 text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:brightness-105 group cursor-pointer h-full min-h-[80px]"
          style={{ backgroundColor: 'var(--feature-header-accent)' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/5 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 80% 80%, white 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <CardContent className="relative p-3 h-full flex items-center">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-black/10 group-hover:bg-black/20 transition-colors duration-300 flex-shrink-0">
                <Users className="h-5 w-5 text-slate-900" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">Manage Leads</h3>
                <p className="text-slate-800 text-xs">View and manage leads</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-slate-900 border-0 font-medium px-3 py-1.5 h-7 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                  <Users className="mr-1 h-3 w-3" />
                  View
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Manage Customers Tile */}
      <Link href="/customers" className="block">
        <Card
          className="relative overflow-hidden border-0 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:brightness-110 group cursor-pointer h-full min-h-[80px]"
          style={{ backgroundColor: 'var(--sidebar)' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/5 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, white 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <CardContent className="relative p-3 h-full flex items-center">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300 flex-shrink-0">
                <UserCircle className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">Manage Customers</h3>
                <p className="text-blue-100 text-xs">View customer database</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-blue-600 border-0 font-medium px-3 py-1.5 h-7 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                  <UserCircle className="mr-1 h-3 w-3" />
                  View
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Add Customer Tile */}
      <Link href="/customers/new" className="block">
        <Card
          className="relative overflow-hidden border-0 text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:brightness-105 group cursor-pointer h-full min-h-[80px]"
          style={{ backgroundColor: 'var(--feature-header-accent)' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/5 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, white 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <CardContent className="relative p-3 h-full flex items-center">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-black/10 group-hover:bg-black/20 transition-colors duration-300 flex-shrink-0">
                <Plus className="h-5 w-5 text-slate-900" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">Add Customer</h3>
                <p className="text-slate-800 text-xs">Register a new customer</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-slate-900 border-0 font-medium px-3 py-1.5 h-7 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Manage Products Tile */}
      <Link href="/products" className="block">
        <Card
          className="relative overflow-hidden border-0 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:brightness-110 group cursor-pointer h-full min-h-[80px]"
          style={{ backgroundColor: 'var(--sidebar)' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/5 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 80% 20%, white 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <CardContent className="relative p-3 h-full flex items-center">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300 flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">Manage Products</h3>
                <p className="text-blue-100 text-xs">View product catalog</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-blue-600 border-0 font-medium px-3 py-1.5 h-7 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  View
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {showAddProduct ? (
        <>
          {/* Add Product Tile */}
          <Link href="/products/new" className="block">
            <Card
              className="relative overflow-hidden border-0 text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:brightness-105 group cursor-pointer h-full min-h-[80px]"
              style={{ backgroundColor: 'var(--feature-header-accent)' }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-white/5 opacity-30">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, white 0.5px, transparent 0.5px)',
                    backgroundSize: '20px 20px',
                  }}
                />
              </div>

              <CardContent className="relative p-3 h-full flex items-center">
                <div className="flex items-center space-x-4">
                  {/* Icon Container */}
                  <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-black/10 group-hover:bg-black/20 transition-colors duration-300 flex-shrink-0">
                    <Plus className="h-5 w-5 text-slate-900" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold mb-0.5">Add Product</h3>
                    <p className="text-slate-800 text-xs">Add a new product to catalog</p>
                  </div>

                  {/* Action Button - Now just visual indicator */}
                  <div className="flex-shrink-0">
                    <div className="bg-white text-slate-900 border-0 font-medium px-3 py-1.5 h-7 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </>
      ) : null}
    </div>
  );
}
