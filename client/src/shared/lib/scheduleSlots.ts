import type { BookingType, ServiziType, ShaduleType } from "@/shared/types";

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMinutesFromDate(value: string) {
  const date = new Date(value);

  return date.getHours() * 60 + date.getMinutes();
}

export function getDateTime(dateKey: string, time: string, duration: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const startTime = new Date(`${dateKey}T00:00:00`);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);

  return { startTime, endTime };
}

export function formatTime(totalMinutes: number) {
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  const minutes = `${totalMinutes % 60}`.padStart(2, "0");

  return `${hours}:${minutes}`;
}

function isBookingCanceled(booking: BookingType) {
  const status = booking.status.toLowerCase();

  return status.includes("cancel") || status.includes("\u043e\u0442\u043c\u0435\u043d");
}

export function buildSlotsByDate(
  service: Pick<ServiziType, "duration"> | null,
  shadules: ShaduleType[],
  bookings: BookingType[],
  daysAhead = 21,
) {
  if (!service || shadules.length === 0) {
    return {};
  }

  const slotsByDate: Record<string, string[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayIndex = 0; dayIndex < daysAhead; dayIndex += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayIndex);

    const shadule = shadules.find(
      (item) => item.dayOdWeek === date.getDay() && item.isWorkingDay,
    );

    if (!shadule) {
      continue;
    }

    const dateKey = toDateKey(date);
    const startMinutes = getMinutesFromDate(shadule.startTime);
    const endMinutes = getMinutesFromDate(shadule.endTime);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const duration = service.duration;
    const dayBookings = bookings.filter((booking) => {
      const bookingDateKey = toDateKey(new Date(booking.startTime));

      return bookingDateKey === dateKey && !isBookingCanceled(booking);
    });

    for (
      let slotStart = startMinutes;
      slotStart + duration <= endMinutes;
      slotStart += duration
    ) {
      const slotEnd = slotStart + duration;
      const isPastTodaySlot = dayIndex === 0 && slotStart <= currentMinutes;
      const hasConflict = dayBookings.some((booking) => {
        const bookedStart = getMinutesFromDate(booking.startTime);
        const bookedEnd = getMinutesFromDate(booking.endTime);

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (!isPastTodaySlot && !hasConflict) {
        slotsByDate[dateKey] = [...(slotsByDate[dateKey] ?? []), formatTime(slotStart)];
      }
    }
  }

  return slotsByDate;
}
