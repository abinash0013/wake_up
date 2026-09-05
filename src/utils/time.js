export const formatTime = date => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

export const currentWeekday = (date = new Date()) =>
  date.toLocaleDateString('en-US', {weekday: 'long'});

export const getShortDay = (date = new Date()) =>
  date.toLocaleDateString('en-US', {weekday: 'short'});
