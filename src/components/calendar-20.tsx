"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

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
  initialDate,
  initialTime,
  showContinueButton = true,
  continueButtonText = "Continue",
  onContinue,
  disabled = false,
}: Calendar20Props) {
  const [date, setDate] = React.useState<Date | undefined>(
    initialDate || new Date(2025, 5, 12)
  )
  const [selectedTime, setSelectedTime] = React.useState<string | null>(initialTime || null)
  
  // Use provided time slots or generate default ones
  const timeSlots = React.useMemo(() => {
    if (availableTimeSlots && availableTimeSlots.length > 0) {
      return availableTimeSlots;
    }
    return Array.from({ length: 37 }, (_, i) => {
      const totalMinutes = i * 15
      const hour = Math.floor(totalMinutes / 60) + 9
      const minute = totalMinutes % 60
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    })
  }, [availableTimeSlots]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (date && onDateTimeSelected) {
      onDateTimeSelected(date, time);
    }
  };

  return (
    <Card className="gap-0 p-0">
      <CardContent className="relative p-0 md:pr-48">
        <div className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            defaultMonth={date}
            disabled={(date) => 
              disabled ||
              date < new Date() || 
              bookedDates.some(bookedDate => 
                bookedDate.toDateString() === date.toDateString()
              )
            }
            showOutsideDays={false}
            modifiers={{
              booked: bookedDates,
            }}
            modifiersClassNames={{
              booked: "[&>button]:line-through opacity-100",
            }}
            className="bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
            formatters={{
              formatWeekdayName: (date) => {
                return date.toLocaleString("en-US", { weekday: "short" })
              },
            }}
          />
        </div>
        <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
          <div className="grid gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                onClick={() => handleTimeSelect(time)}
                disabled={disabled}
                className="w-full shadow-none"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      {showContinueButton && (
        <CardFooter className="flex flex-col gap-4 border-t px-6 !py-5 md:flex-row">
          <div className="text-sm">
            {date && selectedTime ? (
              <>
                Your meeting is booked for{" "}
                <span className="font-medium">
                  {date?.toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                </span>
                at <span className="font-medium">{selectedTime}</span>.
              </>
            ) : (
              <>Select a date and time for your meeting.</>
            )}
          </div>
          <Button
            disabled={!date || !selectedTime || disabled}
            onClick={() => {
              if (onContinue) {
                onContinue();
              } else if (date && selectedTime && onDateTimeSelected) {
                onDateTimeSelected(date, selectedTime);
              }
            }}
            className="w-full md:ml-auto md:w-auto"
            variant="outline"
          >
            {continueButtonText}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
