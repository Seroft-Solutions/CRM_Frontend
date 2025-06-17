"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Calendar20Props {
  onDateTimeSelected?: (date: Date, time: string) => void;
  bookedDates?: Date[];
  availableTimeSlots?: string[];
  initialDate?: Date;
  initialTime?: string;
  showContinueButton?: boolean;
  continueButtonText?: string;
  onContinue?: () => void;
  disabled?: boolean;
}

export default function Calendar20({
  onDateTimeSelected,
  bookedDates = [],
  availableTimeSlots,
  initialDate = new Date(2025, 5, 12),
  initialTime,
  showContinueButton = true,
  continueButtonText = "Continue",
  onContinue,
  disabled = false
}: Calendar20Props) {
  const [date, setDate] = React.useState<Date | undefined>(initialDate)
  const [selectedTime, setSelectedTime] = React.useState<string | null>(initialTime || null)
  
  // Default time slots if none provided
  const defaultTimeSlots = React.useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => {
      const totalMinutes = i * 30 // 30-minute intervals
      const hour = Math.floor(totalMinutes / 60) + 9 // Start at 9 AM
      const minute = totalMinutes % 60
      if (hour >= 17) return null // End at 5 PM
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    }).filter(Boolean) as string[]
  }, []);
  
  const timeSlots = availableTimeSlots || defaultTimeSlots;

  // Default booked dates if none provided
  const defaultBookedDates = React.useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => new Date(2025, 5, 17 + i))
  }, []);

  const actualBookedDates = bookedDates.length > 0 ? bookedDates : defaultBookedDates;

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    // Reset time when date changes
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (date && onDateTimeSelected) {
      onDateTimeSelected(date, time);
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else if (date && selectedTime && onDateTimeSelected) {
      onDateTimeSelected(date, selectedTime);
    }
  };

  // Split time slots into morning and afternoon
  const morningSlots = timeSlots.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour < 12;
  });

  const afternoonSlots = timeSlots.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12;
  });

  return (
    <div className={cn("w-full space-y-4", disabled && "opacity-50 pointer-events-none")}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Calendar Section */}
        <div className="md:col-span-3">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Available Dates</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                defaultMonth={date}
                disabled={actualBookedDates}
                showOutsideDays={false}
                modifiers={{
                  booked: actualBookedDates,
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through [&>button]:text-muted-foreground [&>button]:bg-muted/50",
                }}
                className="rounded-md border-0 p-0 [--cell-size:2.25rem] w-full"
                formatters={{
                  formatWeekdayName: (date) => {
                    return date.toLocaleString("en-US", { weekday: "short" })
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Time Slots Section */}
        <div className="md:col-span-2">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Available Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {date ? (
                <>
                  {/* Morning Slots */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs h-5">Morning</Badge>
                      <Separator className="flex-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {morningSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(time)}
                          className={cn(
                            "text-xs h-7 transition-all",
                            selectedTime === time && "ring-1 ring-primary/20"
                          )}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Afternoon Slots */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs h-5">Afternoon</Badge>
                      <Separator className="flex-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {afternoonSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(time)}
                          className={cn(
                            "text-xs h-7 transition-all",
                            selectedTime === time && "ring-1 ring-primary/20"
                          )}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Select a date first</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selection Summary - Only show when BOTH date and time are selected */}
      {date && selectedTime && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-800">
                  Meeting Selected
                </p>
                <p className="text-xs text-green-700">
                  <span className="font-medium">
                    {date?.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {" at "}
                  <span className="font-medium">{selectedTime}</span>
                </p>
              </div>
              {showContinueButton && (
                <Button
                  onClick={handleContinue}
                  size="sm"
                  className="ml-auto h-7 text-xs"
                >
                  {continueButtonText}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}