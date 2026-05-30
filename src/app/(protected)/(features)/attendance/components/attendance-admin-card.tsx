'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, ShieldCheck } from 'lucide-react';
import { AttendanceAppointmentDTO, AttendanceRecordDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AttendanceAppointmentTable } from './attendance-appointment-table';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { AttendancePendingApprovalsCard } from './attendance-pending-approvals-card';
import { AttendanceTable } from './attendance-table';

export type AttendanceAdminUserOption = {
  id: string;
  label: string;
  description?: string;
};

type AttendanceAdminCardProps = {
  adminDate: string;
  onAdminDateChange: (value: string) => void;
  userOptions: AttendanceAdminUserOption[];
  selectedUserId: string;
  onSelectedUserIdChange: (value: string) => void;
  attendanceRows: AttendanceRecordDTO[];
  appointmentRows: AttendanceAppointmentDTO[];
  pendingApprovalRows: AttendanceRecordDTO[];
  isUserLoading: boolean;
  isAttendanceLoading: boolean;
  isAppointmentLoading: boolean;
  isPendingApprovalsLoading: boolean;
  approvingDayId?: number | null;
  approvingWeekKey?: string | null;
  onViewDetails: (record: AttendanceRecordDTO) => void;
  onApproveDay: (record: AttendanceRecordDTO) => void;
  onApproveWeek: (userId: string, weekStartDate: string, weekKey: string) => void;
};

export function AttendanceAdminCard({
  adminDate,
  onAdminDateChange,
  userOptions,
  selectedUserId,
  onSelectedUserIdChange,
  attendanceRows,
  appointmentRows,
  pendingApprovalRows,
  isUserLoading,
  isAttendanceLoading,
  isAppointmentLoading,
  isPendingApprovalsLoading,
  approvingDayId,
  approvingWeekKey,
  onViewDetails,
  onApproveDay,
  onApproveWeek,
}: AttendanceAdminCardProps) {
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const appointmentUsers = useMemo(() => {
    const groupedUsers = new Map<
      string,
      {
        userId: string;
        label: string;
        count: number;
      }
    >();

    for (const appointment of appointmentRows) {
      const userId = appointment.userId;

      if (!userId) {
        continue;
      }

      const existingUser = groupedUsers.get(userId);

      if (existingUser) {
        existingUser.count += 1;
        continue;
      }

      groupedUsers.set(userId, {
        userId,
        label: appointment.userDisplayName || appointment.userLogin || userId,
        count: 1,
      });
    }

    return Array.from(groupedUsers.values()).sort((left, right) =>
      left.label.localeCompare(right.label)
    );
  }, [appointmentRows]);

  const [selectedAppointmentUserId, setSelectedAppointmentUserId] = useState<string>('');

  useEffect(() => {
    if (!appointmentUsers.length) {
      setSelectedAppointmentUserId('');

      return;
    }

    const selectedUserStillExists = appointmentUsers.some(
      (appointmentUser) => appointmentUser.userId === selectedAppointmentUserId
    );

    if (!selectedUserStillExists) {
      setSelectedAppointmentUserId(appointmentUsers[0]?.userId ?? '');
    }
  }, [appointmentUsers, selectedAppointmentUserId]);

  const selectedAppointmentUser = appointmentUsers.find(
    (appointmentUser) => appointmentUser.userId === selectedAppointmentUserId
  );
  const selectedUserAppointments = appointmentRows.filter(
    (appointment) => appointment.userId === selectedAppointmentUserId
  );
  const selectedUserOption = userOptions.find((userOption) => userOption.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Admin Attendance View
        </CardTitle>
        <CardDescription>All user attendance for the selected date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(220px,280px)_minmax(280px,420px)]">
          <div className="grid gap-2">
            <Label htmlFor="admin-attendance-date">Date</Label>
            <Input
              id="admin-attendance-date"
              type="date"
              value={adminDate}
              onChange={(event) => onAdminDateChange(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>User</Label>
            <Popover open={isUserSelectOpen} onOpenChange={setIsUserSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isUserSelectOpen}
                  className="justify-between"
                  disabled={isUserLoading}
                >
                  <span className="truncate">
                    {isUserLoading ? 'Loading users...' : selectedUserOption?.label || 'All users'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(420px,calc(100vw-2rem))] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="All users"
                        onSelect={() => {
                          onSelectedUserIdChange('');
                          setIsUserSelectOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedUserId === '' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span>All users</span>
                      </CommandItem>
                      {userOptions.map((userOption) => (
                        <CommandItem
                          key={userOption.id}
                          value={`${userOption.label} ${userOption.description ?? ''}`}
                          onSelect={() => {
                            onSelectedUserIdChange(userOption.id);
                            setIsUserSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedUserId === userOption.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block truncate">{userOption.label}</span>
                            {userOption.description ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {userOption.description}
                              </span>
                            ) : null}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Tabs defaultValue="attendance" className="gap-4">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="attendance" className="shrink-0">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="pending-approvals" className="shrink-0">
              Pending Approvals
            </TabsTrigger>
            <TabsTrigger value="appointments" className="shrink-0">
              Appointments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            {isAttendanceLoading ? (
              <AttendanceLoadingRow message="Loading admin attendance…" />
            ) : (
              <AttendanceTable rows={attendanceRows} showActions onViewDetails={onViewDetails} />
            )}
          </TabsContent>

          <TabsContent value="pending-approvals">
            <AttendancePendingApprovalsCard
              rows={pendingApprovalRows}
              isLoading={isPendingApprovalsLoading}
              embedded
              approvingDayId={approvingDayId}
              approvingWeekKey={approvingWeekKey}
              onApproveDay={onApproveDay}
              onApproveWeek={onApproveWeek}
            />
          </TabsContent>

          <TabsContent value="appointments">
            {isAppointmentLoading ? (
              <AttendanceLoadingRow message="Loading admin appointment attendance…" />
            ) : appointmentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointment attendance records found for the selected date.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <Card className="gap-4 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-base">Users With Appointments</CardTitle>
                    <CardDescription>
                      Select a user to view all appointment check-ins and check-outs for{' '}
                      {adminDate || 'the selected date'}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 px-4">
                    {appointmentUsers.map((appointmentUser) => (
                      <Button
                        key={appointmentUser.userId}
                        type="button"
                        variant={
                          appointmentUser.userId === selectedAppointmentUserId
                            ? 'default'
                            : 'outline'
                        }
                        className="justify-between"
                        onClick={() => setSelectedAppointmentUserId(appointmentUser.userId)}
                      >
                        <span className="truncate">{appointmentUser.label}</span>
                        <span>{appointmentUser.count}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="gap-4 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-base">
                      {selectedAppointmentUser?.label || 'Selected User'} Appointment List
                    </CardTitle>
                    <CardDescription>
                      {selectedUserAppointments.length} appointment
                      {selectedUserAppointments.length === 1 ? '' : 's'} on{' '}
                      {adminDate || 'the selected date'}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4">
                    <AttendanceAppointmentTable rows={selectedUserAppointments} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
