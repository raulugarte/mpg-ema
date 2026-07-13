const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Build a static month calendar grid mirroring the source datepicker.
 * The source calendar is a JS datepicker widget the import can't carry; we
 * rebuild a static grid from the month/year caption and the event date already
 * present in the column (e.g. "July 2026" + "Jul 4, 2026 …").
 * @param {number} year full year
 * @param {number} monthIndex 0-based month
 * @param {number[]} eventDays day numbers that carry an event
 * @returns {HTMLTableElement}
 */
function buildCalendar(year, monthIndex, eventDays) {
  const table = document.createElement('table');
  table.className = 'columns-events-calendar';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  DOW.forEach((d) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.className = 'columns-events-dow';
    th.textContent = d;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const first = new Date(year, monthIndex, 1);
  // Monday-based lead offset (JS getDay: 0=Sun..6=Sat)
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let day = 1;
  for (let week = 0; week < 6 && day <= daysInMonth; week += 1) {
    const tr = document.createElement('tr');
    for (let col = 0; col < 7; col += 1) {
      const td = document.createElement('td');
      const cellIndex = week * 7 + col;
      if (cellIndex < lead || day > daysInMonth) {
        td.className = 'columns-events-day columns-events-day-empty';
      } else {
        td.className = 'columns-events-day';
        td.textContent = day;
        if (eventDays.includes(day)) {
          td.classList.add('columns-events-day-event');
        }
        day += 1;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-events-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-events-img-col');
        }
      }
    });
  });

  // Rebuild the source's month calendar grid. Find the column whose first
  // paragraph is a "<Month> <Year>" caption, then read event day numbers from
  // any "<Mon> <D>, <Year>" date paragraph in that same column.
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const paras = [...col.querySelectorAll(':scope > p')];
      const caption = paras.find((p) => {
        const m = p.textContent.trim().toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
        return m && MONTHS.includes(m[1]);
      });
      if (!caption) return;

      const [, monthName, yearStr] = caption.textContent.trim().toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
      const monthIndex = MONTHS.indexOf(monthName);
      const year = parseInt(yearStr, 10);

      const eventDays = [];
      paras.forEach((p) => {
        const m = p.textContent.trim().match(/\b([a-z]{3,})\.?\s+(\d{1,2}),\s*\d{4}\b/i);
        if (m && MONTHS.some((mo) => mo.startsWith(m[1].toLowerCase().slice(0, 3)))) {
          eventDays.push(parseInt(m[2], 10));
        }
      });

      col.classList.add('columns-events-calendar-col');
      const cal = buildCalendar(year, monthIndex, eventDays);
      caption.after(cal);
    });
  });
}
