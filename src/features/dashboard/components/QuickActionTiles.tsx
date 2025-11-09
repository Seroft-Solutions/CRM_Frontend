'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users } from 'lucide-react';
import Link from 'next/link';

export function QuickActionTiles() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Add Lead Tile */}
      <Link href="/calls/new" className="block">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group cursor-pointer">
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

          <CardContent className="relative p-4">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300 flex-shrink-0">
                <Plus className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1">New Lead</h3>
                <p className="text-blue-100 text-xs">Capture prospect details</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-blue-600 border-0 font-medium px-4 py-2 h-8 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
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
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group cursor-pointer">
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

          <CardContent className="relative p-4">
            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300 flex-shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1">Manage Leads</h3>
                <p className="text-emerald-100 text-xs">View and manage leads</p>
              </div>

              {/* Action Button - Now just visual indicator */}
              <div className="flex-shrink-0">
                <div className="bg-white text-emerald-600 border-0 font-medium px-4 py-2 h-8 rounded-md text-sm group-hover:shadow-md transition-all duration-300 flex items-center">
                  <Users className="mr-1 h-3 w-3" />
                  View
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
