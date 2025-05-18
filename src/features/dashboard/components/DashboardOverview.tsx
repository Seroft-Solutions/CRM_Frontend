'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetAllCalls } from '@/core/api/generated/endpoints/call-resource/call-resource.gen';
import { useGetAllParties } from '@/core/api/generated/endpoints/party-resource/party-resource.gen';
import { useGetAllProducts } from '@/core/api/generated/endpoints/product-resource/product-resource.gen';
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building, Phone, ShoppingCart, Users } from 'lucide-react';

export function DashboardOverview() {
  const { data: calls = [] } = useGetAllCalls({ size: 100 });
  const { data: parties = [] } = useGetAllParties({ size: 100 });
  const { data: products = [] } = useGetAllProducts({ size: 100 });
  
  const [tabValue, setTabValue] = useState("overview");

  // Call status statistics - using real data
  const callStatuses = calls.reduce((acc, call) => {
    const status = call.status || 'PENDING';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const callStatusData = Object.entries(callStatuses).map(([name, value]) => ({
    name,
    value
  }));

  // Products data - using real data
  const productData = products.slice(0, 5).map(product => ({
    name: product.name || 'Unnamed Product',
    value: 1 // Just counting occurrences for now
  }));

  // Recent calls - using real data
  const recentCalls = calls.slice(0, 5).map(call => ({
    id: call.id,
    title: `Call with ${call.party?.name || 'Unknown Party'}`,
    type: 'Call',
    date: 'Recently' // We don't have date info in the model
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
            <p className="text-xs text-muted-foreground">
              Total calls in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Parties</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parties.length}</div>
            <p className="text-xs text-muted-foreground">
              Total parties in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Total products in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parties.filter(party => party.address1 || party.address2 || party.address3).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Parties with address details
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Call Distribution</CardTitle>
            <CardDescription>
              Status of calls in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {calls.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={callStatusData}>
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
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
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Call Status</CardTitle>
            <CardDescription>
              Distribution of calls by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={callStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {callStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <p className="text-muted-foreground">No call status data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Available products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productData.length > 0 ? (
              <div className="space-y-4">
                {productData.map((product) => (
                  <div key={product.name} className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                    <span>{product.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No product data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>
              Latest call activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCalls.length > 0 ? (
              <div className="space-y-6">
                {recentCalls.map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
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
    </div>
  );
}
