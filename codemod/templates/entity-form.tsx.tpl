'use client';

// React and Next.js imports
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

// Form and validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// API and types
import { [[dto]] } from '@/core/api/generated/schemas';
import { [[hooks.create]], [[hooks.update]] } from '[[endpointImport]]';
[[#fields]]
[[#isEnum]]import { [[pascalCase name]]Values } from './enums';[[/isEnum]]
[[/fields]]

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { 
  Select, SelectTrigger, SelectValue, 
  SelectContent, SelectItem 
} from '@/components/ui/select';
import {
  Form, FormField, FormItem, FormLabel,
  FormControl, FormMessage
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

// Validation schema built from JHipster metadata
const schema = z.object({
[[#fields]]
  [[name]]: [[^isEnum]][[#isString]]z.string().nonempty({ message: "[[label]] is required" })[[/isString]][[#isNumber]]z.number({ required_error: "[[label]] is required" })[[/isNumber]][[#isBoolean]]z.boolean().optional()[[/isBoolean]][[#isDate]]z.date({ required_error: "[[label]] is required" })[[/isDate]][[/isEnum]][[#isEnum]]z.enum([[pascalCase name]]Values, { required_error: "Please select a valid [[label]]" })[[/isEnum]],
[[/fields]]
});

type FormValues = z.infer<typeof schema>;
interface Props { 
  defaultValues?: Partial<[[dto]]>
}

export default function [[entity]]Form({ defaultValues }: Props) {
  const router = useRouter();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  // Setup API mutation
  const { mutate: save, isLoading } = defaultValues?.id
    ? [[hooks.update]]({ 
        mutation: { 
          onSuccess: () => {
            toast.success('[[entity]] updated successfully');
            router.back();
          },
          onError: (err) => toast.error(err.message)
        } 
      })
    : [[hooks.create]]({ 
        mutation: { 
          onSuccess: () => {
            toast.success('[[entity]] created successfully');
            router.back();
          },
          onError: (err) => toast.error(err.message)
        } 
      });

  const onSubmit = async (vals: FormValues) => {
    save(vals as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
[[#fields]]
        <FormField
          control={form.control}
          name="[[name]]"
          render={({ field }) => (
            <FormItem>
              <FormLabel>[[label]]</FormLabel>
              <FormControl>
              [[#isEnum]]
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select [[label]]" />
                  </SelectTrigger>
                  <SelectContent>
                    {[[pascalCase name]]Values.map(v => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              [[/isEnum]]
              [[^isEnum]]
                [[#isBoolean]]
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <label className="text-sm text-gray-500">
                    Enable [[label]]
                  </label>
                </div>
                [[/isBoolean]]
                [[#isDate]]
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                [[/isDate]]
                [[#isString]]<Input {...field} placeholder="Enter [[label]]" />[[/isString]]
                [[#isNumber]]
                <Input 
                  type="number"
                  {...field}
                  onChange={e => field.onChange(e.target.valueAsNumber)}
                  placeholder="Enter [[label]]"
                />
                [[/isNumber]]
              [[/isEnum]]
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
[[/fields]]

        <div className="flex justify-end space-x-4">
          <Button 
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!form.formState.isDirty || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
