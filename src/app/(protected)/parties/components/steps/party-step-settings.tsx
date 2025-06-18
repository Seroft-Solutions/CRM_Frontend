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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";


interface PartyStepSettingsProps {
  form: UseFormReturn<any>;
}

export function PartyStepSettings({ form }: PartyStepSettingsProps) {
  return (
    <div className="space-y-6">

    </div>
  );
}
