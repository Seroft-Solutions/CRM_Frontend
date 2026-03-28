'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

type NotificationChannel = 'email' | 'whatsapp';
type NotificationSettingKey =
  | 'leadNotifications'
  | 'saleOrderNotifications'
  | 'purchaseOrderNotifications';

type NotificationSettingsState = Record<
  NotificationSettingKey,
  Record<NotificationChannel, boolean>
>;

const STORAGE_KEY = 'crm_notification_settings';

const notificationRows: Array<{ key: NotificationSettingKey; label: string }> = [
  { key: 'leadNotifications', label: 'Leads Notification' },
  { key: 'saleOrderNotifications', label: 'Sale Order' },
  { key: 'purchaseOrderNotifications', label: 'Purchase Order Notification' },
];

const defaultSettings: NotificationSettingsState = {
  leadNotifications: { email: true, whatsapp: false },
  saleOrderNotifications: { email: true, whatsapp: false },
  purchaseOrderNotifications: { email: true, whatsapp: false },
};

function readStoredSettings(): NotificationSettingsState {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return defaultSettings;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<NotificationSettingsState>;

    return {
      leadNotifications: {
        email: parsedValue.leadNotifications?.email ?? defaultSettings.leadNotifications.email,
        whatsapp:
          parsedValue.leadNotifications?.whatsapp ?? defaultSettings.leadNotifications.whatsapp,
      },
      saleOrderNotifications: {
        email:
          parsedValue.saleOrderNotifications?.email ?? defaultSettings.saleOrderNotifications.email,
        whatsapp:
          parsedValue.saleOrderNotifications?.whatsapp ??
          defaultSettings.saleOrderNotifications.whatsapp,
      },
      purchaseOrderNotifications: {
        email:
          parsedValue.purchaseOrderNotifications?.email ??
          defaultSettings.purchaseOrderNotifications.email,
        whatsapp:
          parsedValue.purchaseOrderNotifications?.whatsapp ??
          defaultSettings.purchaseOrderNotifications.whatsapp,
      },
    };
  } catch {
    return defaultSettings;
  }
}

export function NotificationSettingsForm() {
  const [settings, setSettings] = useState<NotificationSettingsState>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(readStoredSettings());
    setIsLoaded(true);
  }, []);

  const updateSetting = (
    rowKey: NotificationSettingKey,
    channel: NotificationChannel,
    checked: boolean
  ) => {
    setSettings((current) => ({
      ...current,
      [rowKey]: {
        ...current[rowKey],
        [channel]: checked,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success('Notification settings saved successfully');
    } catch {
      toast.error('Unable to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure which notifications should be sent through Email and WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[minmax(220px,1.6fr)_minmax(120px,1fr)_minmax(120px,1fr)] border-b bg-muted/40">
            <div className="px-4 py-3 text-sm font-semibold text-foreground">Notification</div>
            <div className="px-4 py-3 text-center text-sm font-semibold text-foreground">Email</div>
            <div className="px-4 py-3 text-center text-sm font-semibold text-foreground">
              WhatsApp
            </div>
          </div>

          {notificationRows.map((row, index) => (
            <div
              key={row.key}
              className={`grid grid-cols-[minmax(220px,1.6fr)_minmax(120px,1fr)_minmax(120px,1fr)] items-center ${
                index !== notificationRows.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="px-4 py-4 text-sm font-medium text-foreground">{row.label}</div>
              <div className="flex justify-center px-4 py-4">
                <Switch
                  checked={settings[row.key].email}
                  onCheckedChange={(checked) => updateSetting(row.key, 'email', checked)}
                  aria-label={`${row.label} email toggle`}
                />
              </div>
              <div className="flex justify-center px-4 py-4">
                <Switch
                  checked={settings[row.key].whatsapp}
                  onCheckedChange={(checked) => updateSetting(row.key, 'whatsapp', checked)}
                  aria-label={`${row.label} WhatsApp toggle`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Notification Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
