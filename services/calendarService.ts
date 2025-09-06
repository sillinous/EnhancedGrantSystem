// Function to format a date string into iCalendar format (YYYYMMDD)
const formatDateToICS = (dateStr: string): string => {
  // Assuming dateStr is 'YYYY-MM-DD'
  return dateStr.replace(/-/g, '');
};

/**
 * Generates a data URL for a universal .ics calendar file.
 * @param title - The title of the calendar event.
 * @param description - The description of the event.
 * @param date - The date of the event in 'YYYY-MM-DD' format.
 * @returns A string representing the data URL for the .ics file.
 */
export const createCalendarFile = (title: string, description: string, date: string): string => {
  const icsDate = formatDateToICS(date);
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  // .ics file content structure
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GrantFinderAI//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@grantfinder.ai`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${icsDate}`,
    `DTEND;VALUE=DATE:${icsDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
};
