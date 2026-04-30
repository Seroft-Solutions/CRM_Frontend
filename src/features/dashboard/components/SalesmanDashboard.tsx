'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  useGetAllCalls,
  getAllCalls,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import {
  useGetAllCustomers,
  useGetAllMeetings,
  useCountMeetings,
} from '@/core/api/generated/spring';
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
import { Activity, Calendar, Phone, Search, TrendingUp, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { QuickActionTiles } from './QuickActionTiles';
import { QuickLinks } from './QuickLinks';
import { useGetStaffLeadSummary, StaffLeadSummaryPeriod } from '@/core/api/call-analytics';

type MeetingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'OTHERS';
type CallInsightsPeriod = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

const ACTIVE_LEADS_PAGE_SIZE = 1000;
const MAX_ACTIVE_LEADS_PAGES = 200;

export function SalesmanDashboard() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: allCalls = [] } = useGetAllCalls({ size: 1000 });
  const { data: allCustomers = [] } = useGetAllCustomers({ size: 1000 });

  const [tabValue, setTabValue] = useState('overview');
  const [activeLeadSearchTerm, setActiveLeadSearchTerm] = useState('');
  const [meetingPeriod, setMeetingPeriod] = useState<MeetingPeriod>('DAILY');
  const [callStatusPeriod, setCallStatusPeriod] = useState<CallInsightsPeriod>('ALL');
  const [staffPeriod, setStaffPeriod] = useState<StaffLeadSummaryPeriod>('DAILY');

  const myCalls = useMemo(
    () =>
      allCalls.filter(
        (call) =>
          call.createdBy === session?.user?.email ||
          call.assignedTo?.id === currentUserId ||
          call.assignedTo?.email === session?.user?.email
      ),
    [allCalls, currentUserId, session?.user?.email]
  );

  const myCustomers = useMemo(
    () => allCustomers.filter((customer) => customer.createdBy === session?.user?.email),
    [allCustomers, session?.user?.email]
  );

  const { data: allActiveLeads = [] } = useQuery({
    queryKey: ['salesman-dashboard', 'active-leads', 'all-pages'],
    queryFn: async () => {
      const activeLeadCalls: typeof allCalls = [];

      for (let page = 0; page < MAX_ACTIVE_LEADS_PAGES; page += 1) {
        const pageData = await getAllCalls({
          page,
          size: ACTIVE_LEADS_PAGE_SIZE,
          sort: ['id,asc'],
          'status.equals': 'ACTIVE',
        });

        if (pageData.length === 0) {
          break;
        }

        activeLeadCalls.push(...pageData);

        if (pageData.length < ACTIVE_LEADS_PAGE_SIZE) {
          break;
        }
      }

      return activeLeadCalls.filter(
        (call) =>
          call.createdBy === session?.user?.email ||
          call.assignedTo?.id === currentUserId ||
          call.assignedTo?.email === session?.user?.email
      );
    },
    staleTime: 60_000,
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

  const filteredMyMeetings = useMemo(
    () =>
      scheduledMeetings.filter(
        (meeting) =>
          meeting.organizer?.id === currentUserId ||
          meeting.organizer?.email === session?.user?.email
      ),
    [scheduledMeetings, currentUserId, session?.user?.email]
  );

  const getCallDate = (call: (typeof allCalls)[number]) => {
    const rawCallDateTime = (call as Record<string, unknown>)['callDateTime'];
    const dateValue =
      typeof rawCallDateTime === 'string' && rawCallDateTime
        ? rawCallDateTime
        : call.lastModifiedDate || call.createdDate;

    if (!dateValue) {
      return null;
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  };

  const filterCallsByInsightsPeriod = (period: CallInsightsPeriod, inputCalls: typeof allCalls) => {
    if (period === 'ALL') {
      return inputCalls;
    }

    const periodStart = new Date();
    const periodEnd = new Date();

    periodEnd.setHours(23, 59, 59, 999);

    if (period === 'DAILY') {
      periodStart.setHours(0, 0, 0, 0);
      periodStart.setDate(periodStart.getDate() - 6);
    } else if (period === 'WEEKLY') {
      periodStart.setHours(0, 0, 0, 0);
      periodStart.setDate(periodStart.getDate() - 27);
    } else if (period === 'MONTHLY') {
      periodStart.setHours(0, 0, 0, 0);
      periodStart.setDate(1);
      periodStart.setMonth(periodStart.getMonth() - 11);
    }

    return inputCalls.filter((call) => {
      const callDate = getCallDate(call);

      if (!callDate) return false;

      return callDate >= periodStart && callDate <= periodEnd;
    });
  };

  const filteredMyCallsForCallStatus = useMemo(
    () => filterCallsByInsightsPeriod(callStatusPeriod, myCalls),
    [callStatusPeriod, myCalls]
  );

  const myCallStatuses = filteredMyCallsForCallStatus.reduce(
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
    percentage:
      filteredMyCallsForCallStatus.length > 0
        ? ((value / filteredMyCallsForCallStatus.length) * 100).toFixed(1)
        : '0.0',
  }));

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

  const myChannelCounts = useMemo(() => {
    const channelCounts = allActiveLeads.reduce(
      (acc, call) => {
        const channel = call.channelType?.name?.trim();

        if (!channel) {
          return acc;
        }

        acc[channel] = (acc[channel] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    return Object.keys(channelCounts)
      .map((name) => ({
        name,
        value: channelCounts[name],
      }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  }, [allActiveLeads]);

  const myRecentCalls = myCalls
    .filter((call) => call.callDateTime)
    .sort((a, b) => new Date(b.callDateTime).getTime() - new Date(a.callDateTime).getTime())
    .slice(0, 10)
    .map((call) => ({
      id: call.id,
      callId: call.id,
      leadNo: call.leadNo || '-',
      party: call.customer?.customerBusinessName || call.customer?.name || 'Unknown Customer',
      status: call.callStatus?.name || 'Unknown',
      type: call.callType?.name || 'Unknown',
      priority: call.priority?.name || 'Normal',
      date: new Date(call.callDateTime).toLocaleDateString(),
      time: new Date(call.callDateTime).toLocaleTimeString(),
    }));

  const myActiveLeads = useMemo(() => {
    const customersById = allCustomers.reduce(
      (acc, customer) => {
        if (customer.id != null) {
          acc[customer.id] = customer;
        }

        return acc;
      },
      {} as Record<number, (typeof allCustomers)[number]>
    );

    return myCalls
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
        const productName = call.product?.name || 'N/A';
        const parsedLeadCreatedDate = call.createdDate ? new Date(call.createdDate) : null;
        const leadCreatedDate =
          parsedLeadCreatedDate && !Number.isNaN(parsedLeadCreatedDate.getTime())
            ? parsedLeadCreatedDate.toLocaleDateString()
            : 'N/A';
        const leadIdentifier = call.id ?? `${call.leadNo ?? customerName}-${customerPhone}`;

        return {
          id: leadIdentifier,
          callId: call.id,
          leadNo: call.leadNo || '-',
          customerName,
          customerEmail,
          customerPhone,
          productName,
          leadCreatedDate,
          status: call.callStatus?.name || call.status || 'Unknown',
        };
      });
  }, [myCalls, allCustomers]);

  const normalizedActiveLeadSearchTerm = activeLeadSearchTerm.trim().toLowerCase();

  const filteredActiveLeads = useMemo(() => {
    if (!normalizedActiveLeadSearchTerm) {
      return myActiveLeads;
    }

    return myActiveLeads.filter((lead) => {
      const searchableFields = [
        lead.customerName,
        lead.customerEmail === 'N/A' ? '' : lead.customerEmail,
        lead.customerPhone === 'N/A' ? '' : lead.customerPhone,
      ];

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedActiveLeadSearchTerm)
      );
    });
  }, [myActiveLeads, normalizedActiveLeadSearchTerm]);

  const shouldShowLeadDropdown = normalizedActiveLeadSearchTerm.length > 0;
  const dropdownActiveLeads = filteredActiveLeads.slice(0, 10);

  const myLast30Days = useMemo(
    () =>
      myCalls.filter((call) => {
        if (!call.callDateTime) return false;
        const callDate = new Date(call.callDateTime);
        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return callDate >= thirtyDaysAgo;
      }),
    [myCalls]
  );

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

  const callInsightsPeriodLabel: Record<CallInsightsPeriod, string> = {
    ALL: 'all time',
    DAILY: 'last 7 days',
    WEEKLY: 'last 4 weeks',
    MONTHLY: 'last 12 months',
  };

  const { data: staffLeadSummary = [] } = useGetStaffLeadSummary({
    period: staffPeriod,
    assignedUser: session?.user?.email ?? undefined,
  });

  const selectedSummary = staffLeadSummary.find(
    (item) => item.assignedUser === session?.user?.email
  ) || {
    total: 0,
    active: 0,
    inactive: 0,
  };

  const staffPerformanceChartData = useMemo(() => {
    const userName =
      `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() ||
      session?.user?.email ||
      'You';

    return [
      {
        name: userName,
        total: selectedSummary.total,
        active: selectedSummary.active,
        inactive: selectedSummary.inactive,
      },
    ];
  }, [selectedSummary, session?.user]);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Salesman Dashboard</h1>
            <p className="text-muted-foreground">Your leads, customers, and performance overview</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-3">
            <div className="relative w-[320px] shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="lead-search"
                value={activeLeadSearchTerm}
                onChange={(event) => setActiveLeadSearchTerm(event.target.value)}
                placeholder="Search my active leads by customer, email, or phone"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className="h-11 rounded-full border-slate-200 bg-slate-50 pl-10 pr-4"
              />
              {shouldShowLeadDropdown && (
                <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-md border bg-background shadow-lg">
                  {dropdownActiveLeads.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {dropdownActiveLeads.map((lead) => {
                        if (lead.callId) {
                          return (
                            <a
                              key={`${lead.id}-${lead.leadNo}`}
                              href={`/calls/${lead.callId}`}
                              className="block border-b p-3 last:border-b-0 hover:bg-slate-50/80"
                            >
                              <p className="text-sm font-semibold">Lead #{lead.leadNo}</p>
                              <p className="text-xs text-muted-foreground">{lead.customerName}</p>
                              <p className="text-xs text-muted-foreground">{lead.customerEmail}</p>
                              <p className="text-xs text-muted-foreground">{lead.customerPhone}</p>
                              <p className="text-xs text-muted-foreground">
                                Product: {lead.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {lead.leadCreatedDate}
                              </p>
                            </a>
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
                            <p className="text-xs">Product: {lead.productName}</p>
                            <p className="text-xs">Created: {lead.leadCreatedDate}</p>
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
          </div>
        </div>
      </div>

      <div className="mb-6">
        <QuickActionTiles />
        <QuickLinks />
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[420px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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

              {filteredMyMeetings.length > 0 ? (
                <div className="space-y-4 max-h-[360px] overflow-y-auto">
                  {filteredMyMeetings.map((meeting) => {
                    const meetingDate = new Date(meeting.meetingDateTime);
                    const leadId = meeting.call?.id;
                    const leadNo = meeting.call?.leadNo?.trim() || '-';
                    const customer = meeting.assignedCustomer?.customerBusinessName || '-';

                    return (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 border rounded-lg shadow-sm transition-shadow duration-200 bg-slate-50/50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{meeting.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Lead No: {leadNo}</span>
                              <span>-</span>
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>My Call Status Distribution</CardTitle>
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
                  Your call status breakdown for {callInsightsPeriodLabel[callStatusPeriod]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {myCallStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={myCallStatusData}>
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
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <CardTitle>My Channel Distribution</CardTitle>
                <CardDescription>How your active leads are reaching you</CardDescription>
              </CardHeader>
              <CardContent>
                {myChannelCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={myChannelCounts}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {myChannelCounts.map((entry, index) => (
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
                <CardTitle>My Call Types Analysis</CardTitle>
                <CardDescription>
                  Breakdown of call types you&apos;ve been working with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myCallTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={myCallTypeData}>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No call type data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>My Lead Performance</CardTitle>
                  <CardDescription>Leads assigned to you for the selected period</CardDescription>
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

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader>
              <CardTitle>My Call Status Performance</CardTitle>
              <CardDescription>
                Detailed analysis of your call outcomes and status progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
                {myCallStatusData.map((status, index) => (
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

              {myCallStatusData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={myCallStatusData}>
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
