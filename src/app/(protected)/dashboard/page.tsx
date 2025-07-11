"use client";

import { DashboardOverview } from '@/features/dashboard/components/DashboardOverview';
import {useUserAuthorities} from "@/core/auth";
import {useRouter} from "next/navigation";


export default function DashboardPage() {
  const router = useRouter();

  const { hasRole } = useUserAuthorities();

  if (!hasRole('dashboard')) {
    router.push('/calls');
    return null ;
  }

  return <DashboardOverview />;
}
