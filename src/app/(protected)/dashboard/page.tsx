"use client";

import {DashboardOverview} from '@/features/dashboard/components/DashboardOverview';
import {useUserAuthorities, useUserRoles} from "@/core/auth";
import {useRouter} from "next/navigation";


export default function DashboardPage() {
    const router = useRouter();
    const {roles: userRoles, isLoading: rolesLoading} = useUserRoles();

    if (!userRoles.includes('dashboard')) {
        router.push('/calls');
        return null;
    }

    return <DashboardOverview/>;
}
