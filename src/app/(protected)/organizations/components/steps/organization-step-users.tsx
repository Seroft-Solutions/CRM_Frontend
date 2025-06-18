"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "../paginated-relationship-combobox";





interface OrganizationStepUsersProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function OrganizationStepUsers() { return null; }
