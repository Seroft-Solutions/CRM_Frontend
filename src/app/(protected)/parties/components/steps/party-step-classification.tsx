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




interface PartyStepClassificationProps {
  form: UseFormReturn<any>;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
}

export function PartyStepClassification() { return null; }
