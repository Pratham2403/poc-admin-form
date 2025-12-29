const IST_TIMEZONE = "Asia/Kolkata";

type DateInput = Date | string | number;

const toDate = (value: DateInput) =>
  value instanceof Date ? value : new Date(value);

export const formatDateIST = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
) => {
  return toDate(value).toLocaleDateString(undefined, {
    timeZone: IST_TIMEZONE,
    ...options,
  });
};

export const formatTimeIST = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
) => {
  return toDate(value).toLocaleTimeString(undefined, {
    timeZone: IST_TIMEZONE,
    ...options,
  });
};

export const formatDateTimeIST = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) => {
  return toDate(value).toLocaleString(undefined, {
    timeZone: IST_TIMEZONE,
    ...options,
  });
};
