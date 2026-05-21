function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function getMonthName(month) {
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month] || '';
}

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

module.exports = { getDaysInMonth, getMonthName, getCurrentMonthYear };
