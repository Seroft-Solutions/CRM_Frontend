'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  useGetAllCalls,
  useCountCalls,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { useCountProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
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
import {
  Activity,
  Calendar,
  MapPin,
  Phone,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  useCountCustomers,
  useGetAllCustomers,
  useGetAllMeetings,
  useCountMeetings,
  useGetAllUserProfiles,
} from '@/core/api/generated/spring';
import { useOrganizationContext, useOrganizationUsers } from '@/features/user-management/hooks';
import { QuickActionTiles } from './QuickActionTiles';
import { StaffLeadSummaryPeriod, useGetStaffLeadSummary } from '@/core/api/call-analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function DashboardOverview() {
  type MeetingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'OTHERS';
  type CallInsightsPeriod = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

  const { data: calls = [] } = useGetAllCalls({ size: 1000 });
  const { data: customers = [] } = useGetAllCustomers({ size: 1000 });
  const { data: userProfiles = [] } = useGetAllUserProfiles({ size: 1000 });
  const { organizationId } = useOrganizationContext();
  const { users: organizationUsers = [] } = useOrganizationUsers(organizationId, {
    page: 1,
    size: 1000,
  });

  // Get actual counts (not limited to 1000)
  const { data: totalCallsCount = 0 } = useCountCalls();
  const { data: totalCustomersCount = 0 } = useCountCustomers();
  const { data: totalProductsCount = 0 } = useCountProducts();

  const [tabValue, setTabValue] = useState('overview');
  const [activeLeadSearchTerm, setActiveLeadSearchTerm] = useState('');
  const [staffPeriod, setStaffPeriod] = useState<StaffLeadSummaryPeriod>('DAILY');
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [meetingPeriod, setMeetingPeriod] = useState<MeetingPeriod>('DAILY');
  const [callStatusPeriod, setCallStatusPeriod] = useState<CallInsightsPeriod>('ALL');
  const [salesmanPeriod, setSalesmanPeriod] = useState<CallInsightsPeriod>('ALL');
  const [salesManagerPeriod, setSalesManagerPeriod] = useState<CallInsightsPeriod>('ALL');

  const { data: staffLeadSummary = [] } = useGetStaffLeadSummary({
    period: staffPeriod,
    assignedUser: selectedStaff === 'ALL' ? undefined : selectedStaff,
  });

  const getCalendarRange = (period: MeetingPeriod) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'WEEKLY': {
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      }
      case 'MONTHLY':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'DAILY':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const upcomingRange = useMemo(() => {
    const start = new Date();
    const end = new Date();

    end.setDate(end.getDate() + 7);

    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const meetingFiltersBase = useMemo(() => {
    const range = meetingPeriod === 'OTHERS' ? upcomingRange : getCalendarRange(meetingPeriod);

    return {
      'meetingDateTime.greaterThanOrEqual': range.start,
      'meetingDateTime.lessThan': range.end,
      'meetingStatus.in': ['SCHEDULED', 'CONFIRMED'],
    };
  }, [meetingPeriod, upcomingRange]);

  const { data: scheduledMeetings = [] } = useGetAllMeetings({
    ...meetingFiltersBase,
    sort: ['meetingDateTime,asc'],
    size: 20,
  });

  const { data: scheduledMeetingsCount = 0 } = useCountMeetings(meetingFiltersBase);

  const todayRange = useMemo(() => getCalendarRange('DAILY'), []);
  const { data: meetingsTodayCount = 0 } = useCountMeetings({
    'meetingDateTime.greaterThanOrEqual': todayRange.start,
    'meetingDateTime.lessThan': todayRange.end,
    'meetingStatus.in': ['SCHEDULED', 'CONFIRMED'],
  });

  const filterCallsByInsightsPeriod = (period: CallInsightsPeriod) => {
    if (period === 'ALL') {
      return calls;
    }

    const range = getCalendarRange(period);
    const periodStart = new Date(range.start);
    const periodEnd = new Date(range.end);

    return calls.filter((call) => {
      if (!call.callDateTime) return false;

      const callDate = new Date(call.callDateTime);

      if (Number.isNaN(callDate.getTime())) return false;

      return callDate >= periodStart && callDate < periodEnd;
    });
  };

  const filteredCallsForCallStatus = useMemo(
    () => filterCallsByInsightsPeriod(callStatusPeriod),
    [callStatusPeriod, calls]
  );
  const filteredCallsForSalesman = useMemo(
    () => filterCallsByInsightsPeriod(salesmanPeriod),
    [calls, salesmanPeriod]
  );
  const filteredCallsForSalesManager = useMemo(
    () => filterCallsByInsightsPeriod(salesManagerPeriod),
    [calls, salesManagerPeriod]
  );

  const callStatuses = filteredCallsForCallStatus.reduce(
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
    percentage:
      filteredCallsForCallStatus.length > 0
        ? ((value / filteredCallsForCallStatus.length) * 100).toFixed(1)
        : '0.0',
  }));

  const userDisplayNameById = useMemo(() => {
    const map = new Map<string, string>();

    organizationUsers.forEach((user) => {
      if (!user.id) return;

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const displayName = fullName || user.email || user.username || 'Unknown User';

      map.set(user.id, displayName);
    });

    return map;
  }, [organizationUsers]);

  const getAssignedUserChartData = (inputCalls: typeof calls) => {
    const assigneeBuckets = inputCalls.reduce(
      (acc, call) => {
        const assignedUserId = call.assignedTo?.id;

        if (!assignedUserId) {
          return acc;
        }

        const assignedUserName =
          call.assignedTo?.firstName && call.assignedTo?.lastName
            ? `${call.assignedTo.firstName} ${call.assignedTo.lastName}`
            : call.assignedTo?.firstName ||
              userDisplayNameById.get(assignedUserId) ||
              call.assignedTo?.email ||
              'Unknown User';

        if (!acc[assignedUserId]) {
          acc[assignedUserId] = {
            name: assignedUserName,
            value: 0,
          };
        }

        acc[assignedUserId].value += 1;

        return acc;
      },
      {} as Record<string, { name: string; value: number }>
    );

    return Object.values(assigneeBuckets).sort((a, b) => b.value - a.value);
  };

  const normalizeGroupName = (name?: string) =>
    (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const salesmanUserIds = useMemo(() => {
    return new Set(
      organizationUsers
        .filter((user) =>
          (user.assignedGroups || []).some((group) => {
            const normalizedGroupName = normalizeGroupName(group.name);

            return normalizedGroupName === 'salesman' || normalizedGroupName === 'salesmen';
          })
        )
        .map((user) => user.id)
        .filter((userId): userId is string => Boolean(userId))
    );
  }, [organizationUsers]);

  const salesManagerUserIds = useMemo(() => {
    return new Set(
      organizationUsers
        .filter((user) =>
          (user.assignedGroups || []).some((group) => {
            const normalizedGroupName = normalizeGroupName(group.name);

            return (
              normalizedGroupName === 'salesmanager' || normalizedGroupName === 'salesmanagers'
            );
          })
        )
        .map((user) => user.id)
        .filter((userId): userId is string => Boolean(userId))
    );
  }, [organizationUsers]);

  const closedSalesmanCalls = filteredCallsForSalesman.filter((call) => {
    const assignedUserId = call.assignedTo?.id;
    const callStatusName = (call.callStatus?.name || '').trim().toLowerCase();

    return (
      Boolean(assignedUserId) && callStatusName === 'closed' && salesmanUserIds.has(assignedUserId)
    );
  });

  const closedSalesManagerCalls = filteredCallsForSalesManager.filter((call) => {
    const assignedUserId = call.assignedTo?.id;
    const callStatusName = (call.callStatus?.name || '').trim().toLowerCase();

    return (
      Boolean(assignedUserId) &&
      callStatusName === 'closed' &&
      salesManagerUserIds.has(assignedUserId)
    );
  });

  const salesmanClosedCallsByAssignedUserData = getAssignedUserChartData(closedSalesmanCalls);
  const salesManagerClosedCallsByAssignedUserData =
    getAssignedUserChartData(closedSalesManagerCalls);

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

  const customersById = customers.reduce(
    (acc, customer) => {
      if (customer.id != null) {
        acc[customer.id] = customer;
      }

      return acc;
    },
    {} as Record<number, (typeof customers)[number]>
  );

  const activeLeads = calls
    .filter((call) => {
      const leadStatus = call.callStatus?.name?.toLowerCase() ?? '';

      return (
        call.status === 'ACTIVE' ||
        leadStatus.includes('active') ||
        leadStatus.includes('progress') ||
        leadStatus.includes('pending')
      );
    })
    .map((call) => {
      const fullCustomer = call.customer?.id ? customersById[call.customer.id] : undefined;
      const customerName =
        call.customer?.customerBusinessName ||
        fullCustomer?.customerBusinessName ||
        call.customer?.contactPerson ||
        fullCustomer?.contactPerson ||
        'Unknown Customer';
      const customerEmail = call.customer?.email || fullCustomer?.email || 'N/A';
      const customerPhone =
        call.customer?.mobile ||
        call.customer?.whatsApp ||
        fullCustomer?.mobile ||
        fullCustomer?.whatsApp ||
        'N/A';
      const leadIdentifier = call.id ?? `${call.leadNo ?? customerName}-${customerPhone}`;

      return {
        id: leadIdentifier,
        callId: call.id,
        leadNo: call.leadNo || '-',
        customerName,
        customerEmail,
        customerPhone,
        status: call.callStatus?.name || call.status || 'Unknown',
      };
    });

  const normalizedActiveLeadSearchTerm = activeLeadSearchTerm.trim().toLowerCase();

  const filteredActiveLeads = activeLeads.filter((lead) => {
    if (!normalizedActiveLeadSearchTerm) {
      return true;
    }

    const searchableFields = [
      lead.customerName,
      lead.customerEmail === 'N/A' ? '' : lead.customerEmail,
      lead.customerPhone === 'N/A' ? '' : lead.customerPhone,
    ];

    return searchableFields.some((field) =>
      field.toLowerCase().includes(normalizedActiveLeadSearchTerm)
    );
  });
  const shouldShowLeadDropdown = normalizedActiveLeadSearchTerm.length > 0;
  const dropdownActiveLeads = filteredActiveLeads.slice(0, 10);

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

  const staffOptions = useMemo(() => {
    const unique = new Map<string, string>();

    userProfiles.forEach((profile) => {
      if (!profile.email) return;
      const label =
        profile.displayName ||
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
        profile.email;

      unique.set(profile.email, label);
    });

    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [userProfiles]);

  const staffLabelByEmail = useMemo(
    () => new Map(staffOptions.map((staff) => [staff.value, staff.label])),
    [staffOptions]
  );
  const callInsightsPeriodLabel: Record<CallInsightsPeriod, string> = {
    ALL: 'all time',
    DAILY: 'today',
    WEEKLY: 'this week',
    MONTHLY: 'this month',
  };

  const staffTotals = staffLeadSummary.reduce(
    (acc, item) => {
      acc.total += item.total || 0;
      acc.active += item.active || 0;
      acc.inactive += item.inactive || 0;

      return acc;
    },
    { total: 0, active: 0, inactive: 0 }
  );

  const selectedSummary =
    selectedStaff === 'ALL'
      ? staffTotals
      : staffLeadSummary.find((item) => item.assignedUser === selectedStaff) || {
          total: 0,
          active: 0,
          inactive: 0,
        };

  const staffPerformanceChartData = useMemo(() => {
    if (selectedStaff === 'ALL') {
      return staffLeadSummary.map((item) => ({
        name: staffLabelByEmail.get(item.assignedUser || '') || item.assignedUser || 'Unassigned',
        total: item.total || 0,
        active: item.active || 0,
        inactive: item.inactive || 0,
      }));
    }

    return [
      {
        name: staffLabelByEmail.get(selectedStaff) || selectedStaff,
        total: selectedSummary.total,
        active: selectedSummary.active,
        inactive: selectedSummary.inactive,
      },
    ];
  }, [selectedStaff, selectedSummary, staffLabelByEmail, staffLeadSummary]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Complete overview of your customer relationship management
          </p>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="relative mb-4 w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="lead-search"
            value={activeLeadSearchTerm}
            onChange={(event) => setActiveLeadSearchTerm(event.target.value)}
            placeholder="Search active leads by customer, email, or phone"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            className="pl-9"
          />
          {shouldShowLeadDropdown && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-md border bg-background shadow-lg">
              {dropdownActiveLeads.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {dropdownActiveLeads.map((lead) => {
                    if (lead.callId) {
                      return (
                        <Link
                          key={`${lead.id}-${lead.leadNo}`}
                          href={`/calls/${lead.callId}`}
                          className="block border-b p-3 last:border-b-0 hover:bg-slate-50/80"
                        >
                          <p className="text-sm font-semibold">Lead #{lead.leadNo}</p>
                          <p className="text-xs text-muted-foreground">{lead.customerName}</p>
                          <p className="text-xs text-muted-foreground">{lead.customerEmail}</p>
                          <p className="text-xs text-muted-foreground">{lead.customerPhone}</p>
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={`${lead.id}-${lead.leadNo}`}
                        className="border-b p-3 last:border-b-0 text-muted-foreground"
                      >
                        <p className="text-sm font-semibold">Lead #{lead.leadNo}</p>
                        <p className="text-xs">{lead.customerName}</p>
                        <p className="text-xs">{lead.customerEmail}</p>
                        <p className="text-xs">{lead.customerPhone}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-3 text-sm text-muted-foreground">
                  No active leads match your search
                </p>
              )}
            </div>
          )}
        </div>
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

          {/* Scheduled Meetings */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Scheduled Meetings</CardTitle>
                  <CardDescription>
                    {meetingPeriod === 'OTHERS'
                      ? 'Upcoming meetings scheduled in the next 7 days'
                      : 'View meetings for the selected period and today&apos;s schedule'}
                  </CardDescription>
                </div>
                <Tabs
                  value={meetingPeriod}
                  onValueChange={(value) => setMeetingPeriod(value as MeetingPeriod)}
                >
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="DAILY">Daily</TabsTrigger>
                    <TabsTrigger value="WEEKLY">Weekly</TabsTrigger>
                    <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
                    <TabsTrigger value="OTHERS">Others</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <div className="rounded-lg border bg-slate-50/60 p-4">
                  <div className="text-xs text-muted-foreground">
                    {meetingPeriod === 'OTHERS' ? 'Upcoming meetings' : 'Meetings in period'}
                  </div>
                  <div className="text-2xl font-bold">{scheduledMeetingsCount}</div>
                </div>
                <div className="rounded-lg border bg-blue-50/60 p-4">
                  <div className="text-xs text-muted-foreground">Meetings today</div>
                  <div className="text-2xl font-bold">{meetingsTodayCount}</div>
                </div>
              </div>

              {scheduledMeetings.length > 0 ? (
                <div className="space-y-4 max-h-[360px] overflow-y-auto">
                  {scheduledMeetings.map((meeting) => {
                    const meetingDate = new Date(meeting.meetingDateTime);
                    const organizer =
                      meeting.organizer?.displayName ||
                      `${meeting.organizer?.firstName || ''} ${meeting.organizer?.lastName || ''}`.trim() ||
                      meeting.organizer?.email ||
                      'Unassigned';
                    const leadNo = meeting.call?.leadNo || '—';
                    const customer = meeting.assignedCustomer?.customerBusinessName || '—';

                    return (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-slate-50/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{meeting.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{organizer}</span>
                              <span>•</span>
                              <span>Lead {leadNo}</span>
                              <span>•</span>
                              <span>{customer}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{meeting.meetingStatus}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {meetingDate.toLocaleDateString()} {meetingDate.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-[260px] items-center justify-center">
                  <p className="text-muted-foreground">No meetings scheduled for this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Call Status Distribution</CardTitle>
                  <Tabs
                    value={callStatusPeriod}
                    onValueChange={(value) => setCallStatusPeriod(value as CallInsightsPeriod)}
                  >
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="ALL">All</TabsTrigger>
                      <TabsTrigger value="DAILY">Daily</TabsTrigger>
                      <TabsTrigger value="WEEKLY">Weekly</TabsTrigger>
                      <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  Call status breakdown for {callInsightsPeriodLabel[callStatusPeriod]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {callStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={callStatusData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        formatter={(value) => [`${value} calls`, 'Count']}
                        labelFormatter={(label) => `Status: ${label}`}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center">
                    <p className="text-muted-foreground">
                      No call data available for {callInsightsPeriodLabel[callStatusPeriod]}
                    </p>
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

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Salesman Calls</CardTitle>
                  <Tabs
                    value={salesmanPeriod}
                    onValueChange={(value) => setSalesmanPeriod(value as CallInsightsPeriod)}
                  >
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="ALL">All</TabsTrigger>
                      <TabsTrigger value="DAILY">Daily</TabsTrigger>
                      <TabsTrigger value="WEEKLY">Weekly</TabsTrigger>
                      <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  Closed calls grouped by assigned user in the Salesman group for{' '}
                  {callInsightsPeriodLabel[salesmanPeriod]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {salesmanClosedCallsByAssignedUserData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={salesmanClosedCallsByAssignedUserData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value} calls`, 'Count']}
                        labelFormatter={(label) => `Assigned User: ${label}`}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center">
                    <p className="text-muted-foreground">
                      No closed calls found for Salesman group users in{' '}
                      {callInsightsPeriodLabel[salesmanPeriod]}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Sales Manager Calls</CardTitle>
                  <Tabs
                    value={salesManagerPeriod}
                    onValueChange={(value) => setSalesManagerPeriod(value as CallInsightsPeriod)}
                  >
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="ALL">All</TabsTrigger>
                      <TabsTrigger value="DAILY">Daily</TabsTrigger>
                      <TabsTrigger value="WEEKLY">Weekly</TabsTrigger>
                      <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  Closed calls grouped by assigned user in the Sales Manager group for{' '}
                  {callInsightsPeriodLabel[salesManagerPeriod]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {salesManagerClosedCallsByAssignedUserData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={salesManagerClosedCallsByAssignedUserData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" allowDecimals={false} />
                      <Tooltip
                        formatter={(value) => [`${value} calls`, 'Count']}
                        labelFormatter={(label) => `Assigned User: ${label}`}
                      />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[350px] items-center justify-center">
                    <p className="text-muted-foreground">
                      No closed calls found for Sales Manager group users in{' '}
                      {callInsightsPeriodLabel[salesManagerPeriod]}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Channel Analysis */}
          <div className="grid gap-6">
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
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Staff Lead Performance</CardTitle>
                  <CardDescription>Leads assigned to staff for the selected period</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Tabs
                    value={staffPeriod}
                    onValueChange={(value) => setStaffPeriod(value as StaffLeadSummaryPeriod)}
                  >
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="DAILY">Daily</TabsTrigger>
                      <TabsTrigger value="WEEKLY">Weekly</TabsTrigger>
                      <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger className="min-w-[220px]">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Staff</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.value} value={staff.value}>
                          {staff.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {staffLeadSummary.length > 0 || selectedSummary.total > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-slate-50/60 p-4">
                      <div className="text-xs text-muted-foreground">Total Leads</div>
                      <div className="text-2xl font-bold">{selectedSummary.total}</div>
                    </div>
                    <div className="rounded-lg border bg-emerald-50/60 p-4">
                      <div className="text-xs text-muted-foreground">Active Leads</div>
                      <div className="text-2xl font-bold">{selectedSummary.active}</div>
                    </div>
                    <div className="rounded-lg border bg-rose-50/60 p-4">
                      <div className="text-xs text-muted-foreground">Inactive Leads</div>
                      <div className="text-2xl font-bold">{selectedSummary.inactive}</div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={staffPerformanceChartData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="total"
                        name="Total Leads"
                        fill={COLORS[0]}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="active"
                        name="Active Leads"
                        fill={COLORS[1]}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="inactive"
                        name="Inactive Leads"
                        fill={COLORS[2]}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[260px] items-center justify-center">
                  <p className="text-muted-foreground">No data for this period</p>
                </div>
              )}
            </CardContent>
          </Card>

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
