const MONTHS = [
  "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  "JAN", "FEB", "MAR", "APR", "MAY"
];

const MONTH_YEARS = [
  2026, 2026, 2026, 2026, 2026, 2026, 2026,
  2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027,
  2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028,
  2029, 2029, 2029, 2029, 2029
];

const YEAR_STARTS = [1, 8, 20, 32];
const MONTH_AMT = 2000;
const LUMP_AMT = 1000;

function makeMember(sl, name, from, to, lumpFrom, lumpTo) {
  const paid = [];
  for (let m = from; m <= to; m++) {
    const hasLump = lumpFrom !== null && m >= lumpFrom && m <= lumpTo;
    paid.push({ m: m, amt: MONTH_AMT, lump: hasLump ? LUMP_AMT : 0 });
  }
  return { sl: sl, name: name, paid: paid };
}

let MEMBERS = [
  makeMember(1, "AL-AMIN", 1, 5, 1, 5),
  makeMember(2, "JONY", 1, 4, null, null),
  makeMember(3, "JONY-1", 1, 4, null, null),
  makeMember(4, "JONY-2", 1, 4, null, null),
  makeMember(5, "MASUD", 1, 5, null, null),
  makeMember(6, "MASUD-1", 1, 5, null, null),
  makeMember(7, "RANA", 1, 4, 1, 4),
  makeMember(8, "RANA-1", 1, 4, 1, 4),
  makeMember(9, "RANA-2", 1, 4, 1, 4),
  makeMember(10, "MILON", 1, 3, null, null),
  makeMember(11, "MILON-1", 1, 3, null, null),
  makeMember(12, "MILON-2", 1, 3, null, null),
  makeMember(13, "MILON-3", 1, 3, null, null),
  { sl: 14, name: "MONIR", paid: [{ m: 1, amt: 3000, lump: 0 }] },
  makeMember(15, "BAPPY", 1, 5, 1, 4)
];

const TABS = [
  { id: "2026", from: 1, to: 7, range: "JUNE – DECEMBER 2026" },
  { id: "2027", from: 8, to: 19, range: "JANUARY – DECEMBER 2027" },
  { id: "2028", from: 20, to: 31, range: "JANUARY – DECEMBER 2028" },
  { id: "2029", from: 32, to: 36, range: "JANUARY – MAY 2029" },
  { id: "all", from: 1, to: 36, range: "JUNE 2026 – MAY 2029" }
];

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

function totalsOf(m) {
  let monthly = 0;
  let lump = 0;
  for (const p of m.paid) {
    monthly += p.amt;
    lump += p.lump;
  }
  return { monthly: monthly, lump: lump, grand: monthly + lump };
}

function computeTotals() {
  const perMonth = [];
  for (let i = 0; i < 36; i++) {
    perMonth.push({ amt: 0, lump: 0 });
  }
  let monthly = 0;
  let lump = 0;
  const members = MEMBERS.map(function (m) {
    const t = totalsOf(m);
    monthly += t.monthly;
    lump += t.lump;
    for (const p of m.paid) {
      perMonth[p.m - 1].amt += p.amt;
      perMonth[p.m - 1].lump += p.lump;
    }
    return {
      sl: m.sl,
      name: m.name,
      paid: m.paid,
      monthly: t.monthly,
      lump: t.lump,
      grand: t.grand
    };
  });
  return { members: members, perMonth: perMonth, monthly: monthly, lump: lump, grand: monthly + lump };
}

const SHEET_ID = "1jjdL2CaWzDfQ2V01kwm1QiRYouoZPopB58liNV2WlPQ";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/export?format=csv&gid=0";
const REFRESH_SECONDS = 30;
let syncing = false;

function parseSheetCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toNum(v) {
  const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function buildMembers(rows) {
  let headIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i] && rows[i][1];
    if (cell && String(cell).trim() === "NAME") {
      headIdx = i;
      break;
    }
  }
  if (headIdx === -1) return null;

  const members = [];
  for (let i = headIdx + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const tag = r[0] ? String(r[0]).trim().toUpperCase() : "";
    if (tag === "TOTAL") break;
    const name = r[1] ? String(r[1]).trim() : "";
    if (!name) continue;
    const sl = toNum(r[0]);
    if (sl <= 0) continue;

    const paid = [];
    for (let m = 1; m <= 36; m++) {
      const amt = toNum(r[2 * m]);
      const lump = toNum(r[2 * m + 1]);
      if (amt > 0 || lump > 0) {
        paid.push({ m: m, amt: amt, lump: lump });
      }
    }
    members.push({ sl: sl, name: name, paid: paid });
  }
  return members.length ? members : null;
}

function setStatus(state) {
  const chip = document.getElementById("status");
  if (!chip) return;
  if (state === "live") {
    chip.textContent = "Live · updated " + new Date().toLocaleTimeString();
    chip.className = "status live";
  } else {
    chip.textContent = "Cached snapshot (offline)";
    chip.className = "status stale";
  }
}

function loadViaJsonp() {
  return new Promise(function (resolve, reject) {
    const cb = "gvizCb" + Date.now();
    window[cb] = function (resp) {
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
      if (resp && resp.status === "ok" && resp.table) {
        resolve(resp);
      } else {
        reject(new Error("gviz status " + (resp && resp.status)));
      }
    };
    const script = document.createElement("script");
    script.src =
      "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
      "/gviz/tq?tqx=out:json;responseHandler:" + cb + "&gid=0";
    script.onerror = function () {
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error("jsonp load failed"));
    };
    document.head.appendChild(script);
  });
}

function gvizToRows(resp) {
  return resp.table.rows.map(function (row) {
    return (row.c || []).map(function (cell) {
      return cell && cell.v !== null && cell.v !== undefined ? String(cell.v) : "";
    });
  });
}

async function fetchMembers() {
  try {
    const res = await fetch(SHEET_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const members = buildMembers(parseSheetCsv(await res.text()));
    if (!members) throw new Error("Unrecognized sheet layout");
    return members;
  } catch {
    const resp = await loadViaJsonp();
    const members = buildMembers(gvizToRows(resp));
    if (!members) throw new Error("Unrecognized sheet layout");
    return members;
  }
}

async function loadLive() {
  if (syncing) return;
  syncing = true;
  const btn = document.getElementById("refresh");
  if (btn) btn.disabled = true;
  try {
    const members = await fetchMembers();
    MEMBERS.length = 0;
    Array.prototype.push.apply(MEMBERS, members);
    renderAll();
    setStatus("live");
  } catch {
    setStatus("stale");
  } finally {
    syncing = false;
    if (btn) btn.disabled = false;
  }
}

let activeTab = "2026";
let query = "";
let sortKey = "sl";
let sortDir = 1;

function sortMembers(list) {
  return list.slice().sort(function (a, b) {
    let av;
    let bv;
    if (sortKey === "name") {
      av = a.name.toLowerCase();
      bv = b.name.toLowerCase();
    } else if (sortKey === "sl") {
      av = a.sl;
      bv = b.sl;
    } else {
      av = a[sortKey];
      bv = b[sortKey];
    }
    if (av < bv) return -1 * sortDir;
    if (av > bv) return 1 * sortDir;
    return a.sl - b.sl;
  });
}

function arrowFor(key) {
  if (sortKey !== key) return "";
  return sortDir === 1 ? " ▲" : " ▼";
}

function renderStats() {
  const d = computeTotals();
  const cards = [
    { label: "Total Members", value: String(MEMBERS.length), sub: "on the sheet", accent: "indigo" },
    { label: "Monthly Collection", value: fmt(d.monthly), sub: "without lump sum", accent: "green" },
    { label: "Lump Sum", value: fmt(d.lump), sub: "one-time deposits", accent: "amber" },
    { label: "Grand Total", value: fmt(d.grand), sub: "2026 – 2029", accent: "rose" }
  ];
  document.getElementById("stats").innerHTML = cards
    .map(function (c) {
      return (
        '<article class="stat accent-' + c.accent + '">' +
        '<p class="stat-label">' + c.label + "</p>" +
        '<p class="stat-value">' + c.value + "</p>" +
        '<p class="stat-sub">' + c.sub + "</p>" +
        "</article>"
      );
    })
    .join("");
}

function renderChart() {
  const d = computeTotals();
  let max = 0;
  for (const m of d.members) {
    if (m.grand > max) max = m.grand;
  }
  if (max === 0) max = 1;
  const rows = d.members.slice().sort(function (a, b) {
    return b.grand - a.grand || a.sl - b.sl;
  });
  document.getElementById("chart").innerHTML = rows
    .map(function (m) {
      const w1 = (m.monthly / max) * 100;
      const w2 = (m.lump / max) * 100;
      return (
        '<div class="bar-row' + (m.grand === 0 ? " is-zero" : "") + '">' +
        '<span class="bar-name" title="' + m.name + '">' + m.name + "</span>" +
        '<span class="bar-track">' +
        '<span class="seg seg-month" style="width:' + w1 + '%"' +
        (m.monthly > 0 ? ' data-tip="Monthly: ' + fmt(m.monthly) + '"' : "") + "></span>" +
        '<span class="seg seg-lump" style="width:' + w2 + '%"' +
        (m.lump > 0 ? ' data-tip="Lump sum: ' + fmt(m.lump) + '"' : "") + "></span>" +
        "</span>" +
        '<span class="bar-val">' + fmt(m.grand) + "</span>" +
        "</div>"
      );
    })
    .join("");
}

function monthsOfTab() {
  const tab = TABS.find(function (t) {
    return t.id === activeTab;
  });
  const months = [];
  for (let m = tab.from; m <= tab.to; m++) {
    months.push(m);
  }
  return { tab: tab, months: months };
}

function rowHtml(m, months) {
  const map = {};
  for (const p of m.paid) {
    map[p.m] = p;
  }
  let cells = "";
  for (const mi of months) {
    const p = map[mi];
    const ys = YEAR_STARTS.indexOf(mi) !== -1 ? " year-start" : "";
    cells += '<td class="cell-amt' + ys + (p ? " has" : "") + '">' + (p ? fmt(p.amt) : "") + "</td>";
    cells += '<td class="cell-ls' + (p && p.lump ? " has" : "") + '">' + (p && p.lump ? fmt(p.lump) : "") + "</td>";
  }
  return (
    '<tr><td class="col-sl">' + m.sl + "</td>" +
    '<td class="col-name">' + m.name + "</td>" +
    cells +
    '<td class="col-wo">' + fmt(m.monthly) + "</td>" +
    '<td class="col-lump">' + fmt(m.lump) + "</td>" +
    '<td class="col-grand">' + fmt(m.grand) + "</td></tr>"
  );
}

function footHtml(d, months) {
  let cells = "";
  for (const mi of months) {
    const pm = d.perMonth[mi - 1];
    const ys = YEAR_STARTS.indexOf(mi) !== -1 ? " year-start" : "";
    cells += '<td class="cell-amt' + ys + '">' + (pm.amt ? fmt(pm.amt) : "0") + "</td>";
    cells += '<td class="cell-ls">' + (pm.lump ? fmt(pm.lump) : "0") + "</td>";
  }
  return (
    '<tr><td class="col-sl"></td>' +
    '<td class="col-name">TOTAL</td>' +
    cells +
    '<td class="col-wo">' + fmt(d.monthly) + "</td>" +
    '<td class="col-lump">' + fmt(d.lump) + "</td>" +
    '<td class="col-grand">' + fmt(d.grand) + "</td></tr>"
  );
}

function renderTable() {
  const d = computeTotals();
  const view = monthsOfTab();
  const months = view.months;
  const tab = view.tab;

  let list = d.members;
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(function (m) {
      return m.name.toLowerCase().indexOf(q) !== -1;
    });
  }
  list = sortMembers(list);

  let head1 = "<tr>" +
    '<th class="col-sl" rowspan="2" data-sort="sl">SL' + arrowFor("sl") + "</th>" +
    '<th class="col-name" rowspan="2" data-sort="name">NAME' + arrowFor("name") + "</th>";
  let head2 = "<tr>";

  for (const mi of months) {
    const yr = MONTH_YEARS[mi - 1];
    const label = activeTab === "all" ? MONTHS[mi - 1] + " '" + String(yr).slice(2) : MONTHS[mi - 1];
    const ys = YEAR_STARTS.indexOf(mi) !== -1 ? " year-start" : "";
    head1 += '<th class="col-month y-' + yr + ys + '" colspan="2">' + label + "</th>";
    head2 += '<th class="cell-amt head-sub' + ys + '">Amt</th><th class="cell-ls head-sub">L.S.</th>';
  }

  head1 +=
    '<th class="col-wo" rowspan="2" data-sort="monthly">WITHOUT LUMP' + arrowFor("monthly") + "</th>" +
    '<th class="col-lump" rowspan="2" data-sort="lump">LUMP SUM' + arrowFor("lump") + "</th>" +
    '<th class="col-grand" rowspan="2" data-sort="grand">GRAND TOTAL' + arrowFor("grand") + "</th></tr>";
  head2 += "</tr>";

  let body = "";
  if (!list.length) {
    body =
      '<tr class="empty-row"><td colspan="' + (months.length * 2 + 5) +
      '">No member matches “' + query + '”.</td></tr>';
  } else {
    body = list
      .map(function (m) {
        return rowHtml(m, months);
      })
      .join("");
  }

  document.getElementById("sheet").innerHTML =
    "<thead>" + head1 + head2 + "</thead>" +
    "<tbody>" + body + "</tbody>" +
    "<tfoot>" + footHtml(d, months) + "</tfoot>";

  document.getElementById("view-label").textContent =
    "Showing " + tab.range + " · months " + tab.from + "–" + tab.to + " of 36";
}

function renderAll() {
  renderStats();
  renderChart();
  renderTable();
}

function init() {
  renderAll();
  setStatus("stale");
  loadLive();
  setInterval(loadLive, REFRESH_SECONDS * 1000);

  document.getElementById("refresh").addEventListener("click", loadLive);

  document.getElementById("tabs").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    activeTab = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("active", b === btn);
    });
    renderTable();
  });

  document.getElementById("search").addEventListener("input", function (e) {
    query = e.target.value.trim();
    renderTable();
  });

  const chart = document.getElementById("chart");
  const tip = document.getElementById("chart-tip");
  chart.addEventListener("mouseover", function (e) {
    const seg = e.target.closest(".seg");
    if (seg && seg.dataset.tip) {
      tip.textContent = seg.dataset.tip;
      tip.hidden = false;
    }
  });
  chart.addEventListener("mouseout", function (e) {
    if (e.target.closest(".seg")) {
      tip.hidden = true;
    }
  });
  chart.addEventListener("mousemove", function (e) {
    if (tip.hidden) return;
    const pad = 12;
    const x = Math.min(e.clientX + pad, window.innerWidth - tip.offsetWidth - pad);
    const y = Math.min(e.clientY + pad, window.innerHeight - tip.offsetHeight - pad);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  });

  document.getElementById("sheet").addEventListener("click", function (e) {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (sortKey === key) {
      sortDir = -sortDir;
    } else {
      sortKey = key;
      sortDir = key === "name" || key === "sl" ? 1 : -1;
    }
    renderTable();
  });
}

if (typeof document !== "undefined") {
  init();
}
