export const SWIPE_TIME_ZONE = 'America/New_York';

const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

type TzParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getTzParts(date: Date, zoneId: string): TzParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const map = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second)
  };
}

function getTzOffsetMs(instant: Date, zoneId: string) {
  const parts = getTzParts(instant, zoneId);
  const asUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtcMs - instant.getTime();
}

function zonedDateTimeToUtc(
  zoneId: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offsetMs = getTzOffsetMs(utcGuess, zoneId);
  return new Date(utcGuess.getTime() - offsetMs);
}

function getWeekdayIndex(date: Date, zoneId: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneId,
    weekday: 'short'
  })
    .format(date)
    .toLowerCase();
  return WEEKDAY_INDEX[weekday] ?? 0;
}

export function getSwipeWeekWindow(now = new Date(), zoneId = SWIPE_TIME_ZONE) {
  const partsNow = getTzParts(now, zoneId);
  const weekday = getWeekdayIndex(now, zoneId);
  const daysBack = (weekday - 4 + 7) % 7; // Thu anchor

  const localDateCursor = new Date(Date.UTC(partsNow.year, partsNow.month - 1, partsNow.day));
  localDateCursor.setUTCDate(localDateCursor.getUTCDate() - daysBack);

  const startYear = localDateCursor.getUTCFullYear();
  const startMonth = localDateCursor.getUTCMonth() + 1;
  const startDay = localDateCursor.getUTCDate();
  const weekStart = zonedDateTimeToUtc(zoneId, startYear, startMonth, startDay, 0, 0, 0);

  localDateCursor.setUTCDate(localDateCursor.getUTCDate() + 7);
  const endYear = localDateCursor.getUTCFullYear();
  const endMonth = localDateCursor.getUTCMonth() + 1;
  const endDay = localDateCursor.getUTCDate();
  const weekEnd = zonedDateTimeToUtc(zoneId, endYear, endMonth, endDay, 0, 0, 0);

  return { weekStart, weekEnd };
}
