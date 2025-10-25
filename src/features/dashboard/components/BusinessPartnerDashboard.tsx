'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGetAllCalls } from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { useGetAllCustomers } from '@/core/api/generated/spring';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Phone, Users, TrendingUp, UserCheck, Activity, Target } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { QuickActionTiles } from './QuickActionTiles';

export function BusinessPartnerDashboard() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { data: allCalls = [] } = useGetAllCalls({ size: 1000 });
  const { data: allCustomers = [] } = useGetAllCustomers({ size: 1000 });

  const [tabValue, setTabValue] = useState('overview');

  // Filter calls created by or assigned to current business partner
  const myCalls = allCalls.filter(
    (call) =>
      call.createdBy === session?.user?.email ||
      call.assignedTo?.id === currentUserId ||
      call.assignedTo?.email === session?.user?.email
  );

  // Filter customers created by current business partner
  const myCustomers = allCustomers.filter(
    (customer) => customer.createdBy === session?.user?.email
  );

  // Call status distribution for my calls
  const myCallStatuses = myCalls.reduce(
    (acc, call) => {
      const status = call.callStatus?.name || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const myCallStatusData = Object.entries(myCallStatuses).map(([name, value]) => ({
    name,
    value,
    percentage: myCalls.length > 0 ? ((value / myCalls.length) * 100).toFixed(1) : '0',
  }));

  // Call types distribution for my calls
  const myCallTypes = myCalls.reduce(
    (acc, call) => {
      const type = call.callType?.name || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const myCallTypeData = Object.entries(myCallTypes).map(([name, value]) => ({
    name,
    value,
  }));

  // Priority distribution for my calls
  const myPriorityData = myCalls.reduce(
    (acc, call) => {
      const priority = call.priority?.name || 'Normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const myPriorityChartData = Object.entries(myPriorityData).map(([name, value]) => ({
    name,
    value,
  }));

  // Recent calls with proper date handling
  const myRecentCalls = myCalls
    .filter((call) => call.callDateTime)
    .sort((a, b) => new Date(b.callDateTime).getTime() - new Date(a.callDateTime).getTime())
    .slice(0, 10)
    .map((call) => ({
      id: call.id,
      party: call.customer?.name || 'Unknown Customer',
      status: call.callStatus?.name || 'Unknown',
      type: call.callType?.name || 'Unknown',
      priority: call.priority?.name || 'Normal',
      date: new Date(call.callDateTime).toLocaleDateString(),
      time: new Date(call.callDateTime).toLocaleTimeString(),
    }));

  // Calculate trends for my calls
  const myLast30Days = myCalls.filter((call) => {
    if (!call.callDateTime) return false;
    const callDate = new Date(call.callDateTime);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return callDate >= thirtyDaysAgo;
  });

  const myConversionRate =
    myCalls.length > 0
      ? (
          (myCalls.filter(
            (call) =>
              call.callStatus?.name?.toLowerCase().includes('success') ||
              call.callStatus?.name?.toLowerCase().includes('completed')
          ).length /
            myCalls.length) *
          100
        ).toFixed(1)
      : '0.0';

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Partner Dashboard</h1>
          <p className="text-muted-foreground">Your leads, customers, and performance overview</p>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <QuickActionTiles />
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Leads</CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{myCalls.length}</div>
                <p className="text-xs text-muted-foreground">
                  {myLast30Days.length} in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50/30 border-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Customers</CardTitle>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">{myCustomers.length}</div>
                <p className="text-xs text-muted-foreground">Customers you added</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/30 border-purple-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{myConversionRate}%</div>
                <p className="text-xs text-muted-foreground">Your success rate</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50/30 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {
                    myCalls.filter(
                      (call) =>
                        call.callStatus?.name?.toLowerCase().includes('active') ||
                        call.callStatus?.name?.toLowerCase().includes('progress') ||
                        call.callStatus?.name?.toLowerCase().includes('pending')
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">Leads in progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>My Lead Status Distribution</CardTitle>
                <CardDescription>Status of your leads and calls</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {myCallStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={myCallStatusData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        formatter={(value, name) => [`${value} leads`, 'Count']}
                        labelFormatter={(label) => `Status: ${label}`}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center">
                    <p className="text-muted-foreground">No lead data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>My Priority Distribution</CardTitle>
                <CardDescription>Priority breakdown of your leads</CardDescription>
              </CardHeader>
              <CardContent>
                {myPriorityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={myPriorityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {myPriorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center">
                    <p className="text-muted-foreground">No priority data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle>My Recent Leads</CardTitle>
              <CardDescription>Your latest lead activities</CardDescription>
            </CardHeader>
            <CardContent>
              {myRecentCalls.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {myRecentCalls.map((call) => (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-slate-50/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{call.party}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{call.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            call.status?.toLowerCase().includes('success')
                              ? 'default'
                              : call.status?.toLowerCase().includes('pending')
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {call.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {call.date} {call.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground">No recent leads available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Lead Types Analysis */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle>My Lead Types Analysis</CardTitle>
              <CardDescription>Breakdown of lead types you've been working with</CardDescription>
            </CardHeader>
            <CardContent>
              {myCallTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={myCallTypeData}>
                    <XAxis dataKey="name" stroke="#888888" />
                    <YAxis stroke="#888888" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <p className="text-muted-foreground">No lead type data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
