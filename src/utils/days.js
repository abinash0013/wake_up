export const DAYS = [
  {key: 'Sun', short: 'S', label: 'Sunday'},
  {key: 'Mon', short: 'M', label: 'Monday'},
  {key: 'Tue', short: 'T', label: 'Tuesday'},
  {key: 'Wed', short: 'W', label: 'Wednesday'},
  {key: 'Thu', short: 'T', label: 'Thursday'},
  {key: 'Fri', short: 'F', label: 'Friday'},
  {key: 'Sat', short: 'S', label: 'Saturday'},
];

export const ALL_DAYS = DAYS.map(day => day.key);

export const isDayIncluded = (repeatDays, dayKey) =>
  Array.isArray(repeatDays) && repeatDays.includes(dayKey);

export const normalizeRepeatDays = repeatDays => {
  if (Array.isArray(repeatDays) && repeatDays.length > 0) {
    return DAYS.map(day => day.key).filter(key => repeatDays.includes(key));
  }
  return [...ALL_DAYS];
};

export const describeRepeatDays = repeatDays => {
  const normalized = normalizeRepeatDays(repeatDays);
  if (normalized.length === ALL_DAYS.length) {
    return 'Every day';
  }
  if (normalized.length === 0) {
    return 'No days selected';
  }
  return DAYS.filter(day => normalized.includes(day.key))
    .map(day => day.short)
    .join(' ');
};

export const isTodayIncluded = repeatDays => {
  const todayKey = new Date().toLocaleDateString('en-US', {weekday: 'short'});
  return isDayIncluded(repeatDays, todayKey);
};
