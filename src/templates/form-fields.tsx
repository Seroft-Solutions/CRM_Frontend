'use client';

import { UseFormReturn } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Base field props interface
interface BaseFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

// Text field component
interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  min?: number;
  max?: number;
  step?: number;
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  form,
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  type = 'text',
  min,
  max,
  step,
  multiline = false,
  rows = 3,
}: TextFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{required && <span className="text-destructive"> *</span>}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className="resize-y"
                value={field.value || ''}
              />
            ) : (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                value={field.value ?? ''}
                onChange={e => {
                  if (type === 'number') {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    field.onChange(value);
                  } else {
                    field.onChange(e.target.value);
                  }
                }}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Number field component
interface NumberFieldProps extends Omit<TextFieldProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField(props: NumberFieldProps) {
  return <TextField {...props} type="number" />;
}

// Date field component
interface DateFieldProps extends BaseFieldProps {
  showTime?: boolean;
}

export function DateField({
  form,
  name,
  label,
  description,
  required = false,
  disabled = false,
  showTime = false,
}: DateFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}{required && <span className="text-destructive"> *</span>}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  {field.value ? (
                    format(new Date(field.value), showTime ? "PPP p" : "PPP")
                  ) : (
                    <span>Select date{showTime ? " and time" : ""}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => {
                  // If we need time, preserve the current time or set to noon
                  if (showTime && date) {
                    const currentTime = field.value ? new Date(field.value) : new Date();
                    date.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
                  }
                  field.onChange(date);
                }}
                disabled={disabled}
                initialFocus
              />
              
              {showTime && field.value && (
                <div className="p-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Time</div>
                    <Input
                      type="time"
                      value={format(new Date(field.value), "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(field.value);
                        newDate.setHours(hours, minutes, 0, 0);
                        field.onChange(newDate);
                      }}
                      disabled={disabled}
                      className="w-24"
                    />
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Select field component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
}

export function SelectField({
  form,
  name,
  label,
  placeholder,
  description,
  required = false,
  disabled = false,
  options,
}: SelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{required && <span className="text-destructive"> *</span>}</FormLabel>
          <Select 
            value={field.value ?? ''} 
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Checkbox field component
interface CheckboxFieldProps extends BaseFieldProps {
  text?: string;
}

export function CheckboxField({
  form,
  name,
  label,
  text,
  description,
  disabled = false,
}: CheckboxFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

// Export form field components
export const FormFields = {
  TextField,
  NumberField,
  DateField,
  SelectField,
  CheckboxField,
};

export default FormFields;
