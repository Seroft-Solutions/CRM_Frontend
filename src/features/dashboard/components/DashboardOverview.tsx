'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  useGetAllCalls,
  useCountCalls,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import {
  useGetAllProducts,
  useCountProducts,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, MapPin, Phone, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useGetAllCustomers, useCountCustomers } from '@/core/api/generated/spring';
import { QuickActionTiles } from './QuickActionTiles';

export function DashboardOverview() {
  const { data: calls = [] } = useGetAllCalls({ size: 1000 });
  const { data: parties = [] } = useGetAllCustomers({ size: 1000 });
  const { data: products = [] } = useGetAllProducts({ size: 1000 });

  // Get actual counts (not limited to 1000)
  const { data: totalCallsCount = 0 } = useCountCalls();
  const { data: totalCustomersCount = 0 } = useCountCustomers();
  const { data: totalProductsCount = 0 } = useCountProducts();

  const [tabValue, setTabValue] = useState('overview');

  const callStatuses = calls.reduce(
    (acc, call) => {
      const status = call.callStatus?.name || 'Unknown';

      acc[status] = (acc[status] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const callStatusData = Object.entries(callStatuses).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / calls.length) * 100).toFixed(1),
  }));

  const callCategories = calls.reduce(
    (acc, call) => {
      const category = call.callCategory?.name || 'Uncategorized';

      acc[category] = (acc[category] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const callCategoryData = Object.entries(callCategories).map(([name, value]) => ({
    name,
    value,
  }));

  const callTypes = calls.reduce(
    (acc, call) => {
      const type = call.callType?.name || 'Unknown';

      acc[type] = (acc[type] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const callTypeData = Object.entries(callTypes).map(([name, value]) => ({
    name,
    value,
  }));

  const priorityData = calls.reduce(
    (acc, call) => {
      const priority = call.priority?.name || 'Normal';

      acc[priority] = (acc[priority] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const priorityChartData = Object.entries(priorityData).map(([name, value]) => ({
    name,
    value,
  }));

  const channelData = calls.reduce(
    (acc, call) => {
      const channel = call.channelType?.name || 'Unknown';

      acc[channel] = (acc[channel] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const channelChartData = Object.entries(channelData).map(([name, value]) => ({
    name,
    value,
  }));

  const geoData = calls.reduce(
    (acc, call) => {
      const state = call.state?.name || 'Unknown';

      acc[state] = (acc[state] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const topStates = Object.entries(geoData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const agentPerformance = calls.reduce(
    (acc, call) => {
      const agent =
        call.assignedTo?.firstName && call.assignedTo?.lastName
          ? `${call.assignedTo.firstName} ${call.assignedTo.lastName}`
          : call.assignedTo?.firstName || 'Unassigned';

      acc[agent] = (acc[agent] || 0) + 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const topAgents = Object.entries(agentPerformance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const recentCalls = calls
    .filter((call) => call.callDateTime)
    .sort((a, b) => new Date(b.callDateTime).getTime() - new Date(a.callDateTime).getTime())
    .slice(0, 10)
    .map((call) => ({
      id: call.id,
      party: call.party?.name || 'Unknown Party',
      status: call.callStatus?.name || 'Unknown',
      type: call.callType?.name || 'Unknown',
      priority: call.priority?.name || 'Normal',
      agent:
        call.assignedTo?.firstName && call.assignedTo?.lastName
          ? `${call.assignedTo.firstName} ${call.assignedTo.lastName}`
          : 'Unassigned',
      date: new Date(call.callDateTime).toLocaleDateString(),
      time: new Date(call.callDateTime).toLocaleTimeString(),
    }));

  const last30Days = calls.filter((call) => {
    if (!call.callDateTime) return false;
    const callDate = new Date(call.callDateTime);
    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return callDate >= thirtyDaysAgo;
  });

  const conversionRate =
    calls.length > 0
      ? (
          (calls.filter(
            (call) =>
              call.callStatus?.name?.toLowerCase().includes('success') ||
              call.callStatus?.name?.toLowerCase().includes('completed')
          ).length /
            calls.length) *
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

      {/* Quick Action Tiles */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <QuickActionTiles />
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Enhanced KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {totalCallsCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{last30Days.length} in last 30 days</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50/30 border-emerald-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">
                  {totalCustomersCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Customer database size</p>
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
                <div className="text-2xl font-bold text-purple-900">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Call success rate</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50/30 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {totalProductsCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Available products</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Call Status Distribution</CardTitle>
                <CardDescription>Real-time status of all calls in the system</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {callStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={callStatusData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        formatter={(value, name) => [`${value} calls`, 'Count']}
                        labelFormatter={(label) => `Status: ${label}`}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center">
                    <p className="text-muted-foreground">No call data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Call priority breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {priorityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityChartData.map((entry, index) => (
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

          {/* Recent Activity and Geographic Distribution */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Top States</CardTitle>
                <CardDescription>Geographic call distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {topStates.length > 0 ? (
                  <div className="space-y-4">
                    {topStates.map((state, index) => (
                      <div key={state.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                          <span className="text-sm">{state.name}</span>
                        </div>
                        <span className="text-sm font-medium">{state.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-muted-foreground">No geographic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>Latest call activities with detailed information</CardDescription>
              </CardHeader>
              <CardContent>
                {recentCalls.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {recentCalls.map((call) => (
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
                              <span>•</span>
                              <span>{call.agent}</span>
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
                    <p className="text-muted-foreground">No recent calls available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Channel and Category Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>How customers are reaching us</CardDescription>
              </CardHeader>
              <CardContent>
                {channelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={channelChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {channelChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No channel data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Call Categories</CardTitle>
                <CardDescription>Types of customer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {callCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={callCategoryData} layout="horizontal">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Call Types Analysis */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle>Call Types Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of call types across the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {callTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={callTypeData}>
                    <XAxis dataKey="name" stroke="#888888" />
                    <YAxis stroke="#888888" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <p className="text-muted-foreground">No call type data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          {/* Agent Performance */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Agents with highest call volumes</CardDescription>
              </CardHeader>
              <CardContent>
                {topAgents.length > 0 ? (
                  <div className="space-y-4">
                    {topAgents.map((agent, index) => (
                      <div key={agent.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium">{agent.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{agent.value}</span>
                          <span className="text-xs text-muted-foreground">calls</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No agent data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Conversion Rate</span>
                    </div>
                    <span className="text-lg font-bold">{conversionRate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Active Calls</span>
                    </div>
                    <span className="text-lg font-bold">
                      {
                        calls.filter(
                          (call) =>
                            call.callStatus?.name?.toLowerCase().includes('active') ||
                            call.callStatus?.name?.toLowerCase().includes('progress')
                        ).length
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Total Agents</span>
                    </div>
                    <span className="text-lg font-bold">
                      {Object.keys(agentPerformance).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Coverage Areas</span>
                    </div>
                    <span className="text-lg font-bold">{Object.keys(geoData).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Status Analysis */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle>Call Status Performance</CardTitle>
              <CardDescription>
                Detailed analysis of call outcomes and status progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
                {callStatusData.map((status, index) => (
                  <div
                    key={status.name}
                    className="p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-slate-50"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-sm">{status.name}</span>
                    </div>
                    <div className="text-2xl font-bold">{status.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {status.percentage}% of total
                    </div>
                  </div>
                ))}
              </div>

              {callStatusData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={callStatusData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
