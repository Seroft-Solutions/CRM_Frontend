'use client';

import type { StatusTab } from '@/entity-library/config';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function EntityStatusTabs({
  value,
  onValueChange,
  tabs,
  theme = 'default',
}: {
  value: StatusTab;
  onValueChange: (tab: StatusTab) => void;
  tabs: StatusTab[];
  theme?: 'default' | 'sidebar';
}) {
  const listClass =
    theme === 'sidebar'
      ? 'h-auto bg-transparent p-0 gap-1 rounded-full'
      : 'bg-muted/60 p-1 rounded-full';

  const baseTriggerClass =
    theme === 'sidebar'
      ? 'h-8 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/80 hover:bg-white/10'
      : 'rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm';

  const activeClassByTab: Partial<Record<StatusTab, string>> =
    theme === 'sidebar'
      ? {
          active:
            'data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border-emerald-500',
          inactive:
            'data-[state=active]:bg-slate-500 data-[state=active]:text-white data-[state=active]:border-slate-500',
          archived:
            'data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:border-red-500',
          all: 'data-[state=active]:bg-[var(--sidebar-accent)] data-[state=active]:text-[color:var(--sidebar-accent-foreground)] data-[state=active]:border-[color:var(--sidebar-accent)]',
        }
      : {};

  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as StatusTab)}>
      <TabsList className={listClass}>
        {tabs.includes('active') ? (
          <TabsTrigger
            value="active"
            className={`${baseTriggerClass} ${activeClassByTab.active ?? ''}`}
          >
            Active
          </TabsTrigger>
        ) : null}
        {tabs.includes('inactive') ? (
          <TabsTrigger
            value="inactive"
            className={`${baseTriggerClass} ${activeClassByTab.inactive ?? ''}`}
          >
            Inactive
          </TabsTrigger>
        ) : null}
        {tabs.includes('archived') ? (
          <TabsTrigger
            value="archived"
            className={`${baseTriggerClass} ${activeClassByTab.archived ?? ''}`}
          >
            Archived
          </TabsTrigger>
        ) : null}
        {tabs.includes('all') ? (
          <TabsTrigger value="all" className={`${baseTriggerClass} ${activeClassByTab.all ?? ''}`}>
            All
          </TabsTrigger>
        ) : null}
      </TabsList>
    </Tabs>
  );
}
