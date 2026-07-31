function generateOrderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${stamp}-${rand}`;
}

// Produces codes like CNTR-215869
function generateCounterCode() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CNTR-${rand}`;
}

// Is "now" (HH:MM:SS) within [from, to]? Handles overnight windows (e.g. 18:00 - 02:00).
function isWithinTimeWindow(fromStr, toStr) {
  if (!fromStr || !toStr) return true; // no restriction set
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [fh, fm] = fromStr.split(':').map(Number);
  const [th, tm] = toStr.split(':').map(Number);
  const fromMinutes = fh * 60 + fm;
  const toMinutes = th * 60 + tm;

  if (fromMinutes <= toMinutes) {
    return nowMinutes >= fromMinutes && nowMinutes <= toMinutes;
  }
  // overnight window
  return nowMinutes >= fromMinutes || nowMinutes <= toMinutes;
}

function priceForCategory(item, tableCategory) {
  if (tableCategory === 'high') return Number(item.price_high);
  if (tableCategory === 'low') return Number(item.price_low);
  return Number(item.price_medium);
}

module.exports = {
  generateOrderNumber,
  generateCounterCode,
  isWithinTimeWindow,
  priceForCategory
};
