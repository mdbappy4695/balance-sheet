(function () {
  "use strict";

  var SHEET_ID = "1pAGVlxl90KKTYwyHV_o8J8dMzSLp4MG-xAXZv0ziL3U";
  var CSV_URL =
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/export?format=csv&gid=0";
  var JSONP_URL =
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/gviz/tq?tqx=out:json;responseHandler:CB&gid=0";

  var TOTAL_MONTHS = 36;
  var START_YEAR = 2026; // June
  var START_MONTH = 5; // 0-based

  var SNAPSHOT = [
    { sl: 1, name: "AL-AMIN", paid: [{ m: 0, amt: 2000, lump: 1000 }, { m: 1, amt: 2000, lump: 1000 }, { m: 2, amt: 2000, lump: 1000 }, { m: 3, amt: 2000, lump: 1000 }, { m: 4, amt: 2000, lump: 1000 }] },
    { sl: 2, name: "JONY", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }, { m: 3, amt: 2000, lump: 0 }] },
    { sl: 3, name: "JONY-1", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }, { m: 3, amt: 2000, lump: 0 }] },
    { sl: 4, name: "JONY-2", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }, { m: 3, amt: 2000, lump: 0 }] },
    { sl: 5, name: "MASUD", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }, { m: 3, amt: 2000, lump: 0 }, { m: 4, amt: 2000, lump: 0 }] },
    { sl: 6, name: "MASUD-1", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }, { m: 3, amt: 2000, lump: 0 }, { m: 4, amt: 2000, lump: 0 }] },
    { sl: 7, name: "RANA", paid: [{ m: 0, amt: 2000, lump: 1000 }, { m: 1, amt: 2000, lump: 1000 }, { m: 2, amt: 2000, lump: 1000 }, { m: 3, amt: 2000, lump: 1000 }] },
    { sl: 8, name: "RANA-1", paid: [{ m: 0, amt: 2000, lump: 1000 }, { m: 1, amt: 2000, lump: 1000 }, { m: 2, amt: 2000, lump: 1000 }, { m: 3, amt: 2000, lump: 1000 }] },
    { sl: 9, name: "RANA-2", paid: [{ m: 0, amt: 2000, lump: 1000 }, { m: 1, amt: 2000, lump: 1000 }, { m: 2, amt: 2000, lump: 1000 }, { m: 3, amt: 2000, lump: 1000 }] },
    { sl: 10, name: "MILON", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }] },
    { sl: 11, name: "MILON-1", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }] },
    { sl: 12, name: "MILON-2", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }] },
    { sl: 13, name: "MILON-3", paid: [{ m: 0, amt: 2000, lump: 0 }, { m: 1, amt: 2000, lump: 0 }, { m: 2, amt: 2000, lump: 0 }] },
    { sl: 14, name: "MONIR", paid: [] },
    { sl: 15, name: "BAPPY", paid: [{ m: 0, amt: 2000, lump: 1000 }, { m: 1, amt: 2000, lump: 1000 }, { m: 2, amt: 2000, lump: 1000 }, { m: 3, amt: 2000, lump: 1000 }, { m: 4, amt: 2000, lump: 0 }] }
  ];

  var MONTH_LABELS = [];
  (function () {
    var names = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var y = START_YEAR, mm = START_MONTH;
    for (var i = 0; i < TOTAL_MONTHS; i++) {
      MONTH_LABELS.push(names[mm] + " " + y);
      mm++;
      if (mm > 11) { mm = 0; y++; }
    }
  })();

  var YEAR_GROUPS = [[0, 7], [7, 19], [19, 31], [31, 36]]; // calendar-year month ranges: 2026 JUN..DEC, 2027, 2028, 2029 JAN..MAY

  var state = {
    members: SNAPSHOT,
    year: 0,
    query: "",
    sortKey: "",
    sortDir: 1
  };

  var els = {
    status: document.getElementById("status"),
    statusLabel: document.querySelector(".st-label"),
    refresh: document.getElementById("refresh"),
    members: document.getElementById("stat-members"),
    monthly: document.getElementById("stat-monthly"),
    lump: document.getElementById("stat-lump"),
    grand: document.getElementById("stat-grand"),
    chart: document.getElementById("chart"),
    tabs: document.getElementById("tabs"),
    search: document.getElementById("search"),
    head: document.getElementById("ledger-head"),
    body: document.getElementById("ledger-body"),
    foot: document.getElementById("ledger-foot"),
    cols: document.getElementById("ledger-cols"),
    tip: document.getElementById("chart-tip")
  };

  /* ---------- helpers ---------- */

  function nf(v) {
    return Number(v).toLocaleString("en-US");
  }

  function fmoney(m) {
    var s = nf(m.monthly);
    var lump = m.lump && m.lump > 0 ? " + " + nf(m.lump) : "";
    return "৳" + s + lump;
  }

  function memberTotals(member, y) {
    var monthly = 0, lump = 0;
    member.paid.forEach(function (p) {
      if (y === 99 || (p.m >= YEAR_GROUPS[y][0] && p.m < YEAR_GROUPS[y][1])) {
        monthly += p.amt;
        lump += p.lump || 0;
      }
    });
    return { monthly: monthly, lump: lump, grand: monthly + lump };
  }

  function parseNum(s) {
    if (s === null || s === undefined || String(s).trim() === "") return 0;
    var n = parseFloat(String(s).replace(/[,"৳\s]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  /* ---------- CSV parsing ---------- */

  function splitCsvLine(line) {
    var out = [], buf = "", inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { buf += '"'; i++; }
          else inQ = false;
        } else buf += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ",") { out.push(buf); buf = ""; }
        else buf += ch;
      }
    }
    out.push(buf);
    return out;
  }

  function parseSheetCsv(text) {
    var rows = [];
    text.split(/\r?\n/).forEach(function (line) {
      if (line.replace(/,/g, "").trim() === "") return;
      rows.push(splitCsvLine(line));
    });

    var hi = -1;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (row.length > 1 && String(row[1] || "").trim().toUpperCase() === "NAME") { hi = r; break; }
    }
    if (hi < 0) return null;

    var members = [];
    for (var i = hi + 1; i < rows.length; i++) {
      var f = rows[i];
      var f0 = String(f[0] || "").trim();
      if (f0.toUpperCase() === "TOTAL") break;
      if (String(f[1] || "").trim() === "") continue;
      if (!/^\d+$/.test(f0)) continue;

      var paid = [];
      for (var m = 0; m < TOTAL_MONTHS; m++) {
        var mc = 2 + m * 2;
        var lc = mc + 1;
        var amt = mc < f.length ? parseNum(f[mc]) : 0;
        var lump = lc < f.length ? parseNum(f[lc]) : 0;
        if (amt > 0 || lump > 0) paid.push({ m: m, amt: amt, lump: lump });
      }
      members.push({ sl: parseInt(f0, 10), name: String(f[1]).trim(), paid: paid });
    }
    return members;
  }

  /* ---------- live sync ---------- */

  function setStatus(kind, label) {
    els.status.className = "status " + kind;
    els.statusLabel.textContent = label;
  }

  function loadViaJsonp(cb) {
    var script = document.createElement("script");
    var done = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; script.remove(); cb(null); }
    }, 12000);
    window.CB = function (data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      script.remove();
      cb(data && data.table ? data.table : null);
    };
    script.src = JSONP_URL;
    document.head.appendChild(script);
  }

  function tableToRows(tbl) {
    var rows = [];
    (tbl.rows || []).forEach(function (r) {
      var arr = [];
      (r.c || []).forEach(function (c) {
        arr.push(c && c.v !== undefined && c.v !== null ? c.v : "");
      });
      rows.push(arr);
    });
    return rows;
  }

  function fromGviz(tbl) {
    var rows = [];
    var raw = tableToRows(tbl);
    var hi = -1;
    for (var r = 0; r < raw.length; r++) {
      var rr = raw[r];
      var nm = rr[1] !== undefined ? String(rr[1]).toUpperCase().trim() : "";
      if (nm === "NAME") { hi = r; break; }
    }
    if (hi < 0) return null;
    for (var i = hi + 1; i < raw.length; i++) {
      var f = raw[i];
      var f0 = String(f[0] === undefined ? "" : f[0]).trim();
      if (f0.toUpperCase() === "TOTAL") break;
      if (f[1] === undefined || String(f[1]).trim() === "") continue;
      if (!/^\d+$/.test(f0)) continue;
      var paid = [];
      for (var m = 0; m < TOTAL_MONTHS; m++) {
        var mc = 2 + m * 2;
        var lc = mc + 1;
        var amt = parseNum(f[mc]);
        var lump = parseNum(f[lc]);
        if (amt > 0 || lump > 0) paid.push({ m: m, amt: amt, lump: lump });
      }
      rows.push({ sl: parseInt(f0, 10), name: String(f[1]).trim(), paid: paid });
    }
    return rows;
  }

  function fetchMembers(cb) {
    fetch(CSV_URL, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (txt) {
        var list = parseSheetCsv(txt);
        if (!list || list.length === 0) throw new Error("parse");
        cb(list, "live");
      })
      .catch(function () {
        loadViaJsonp(function (tbl) {
          if (!tbl) { cb(null, "offline"); return; }
          cb(fromGviz(tbl), "live");
        });
      });
  }

  function applyLive(list, source) {
    if (!list || list.length === 0) return;
    state.members = list;
    render();
    var now = new Date();
    var hh = ("0" + now.getHours()).slice(-2);
    var mm = ("0" + now.getMinutes()).slice(-2);
    var ss = ("0" + now.getSeconds()).slice(-2);
    setStatus(source === "offline" ? "offline" : "live", source === "offline" ? "Offline — showing last data" : "Live · updated " + hh + ":" + mm + ":" + ss);
  }

  /* ---------- rendering ---------- */

  function globalTotals() {
    var monthly = 0, lump = 0;
    state.members.forEach(function (mm) {
      var t = memberTotals(mm, 99);
      monthly += t.monthly;
      lump += t.lump;
    });
    return { monthly: monthly, lump: lump, grand: monthly + lump };
  }

  function renderStats() {
    els.members.textContent = state.members.length;
    var t = globalTotals();
    els.monthly.textContent = nf(t.monthly);
    els.lump.textContent = nf(t.lump);
    els.grand.textContent = nf(t.grand);
  }

  function maxTotal() {
    var mx = 1;
    state.members.forEach(function (mm) {
      var t = memberTotals(mm, 99);
      if (t.grand > mx) mx = t.grand;
    });
    return mx;
  }

  function renderChart() {
    els.chart.innerHTML = "";
    var list = filteredMembers();
    if (list.length === 0) {
      els.chart.innerHTML = '<p class="empty">No members match your search.</p>';
      return;
    }
    var mx = maxTotal();

    list.forEach(function (mm) {
      var t = memberTotals(mm, 99);
      var row = document.createElement("div");
      row.className = "bar-row";

      var nm = document.createElement("div");
      nm.className = "bar-name";
      nm.textContent = mm.name;
      nm.title = mm.name + " · " + fmoney(t);

      var track = document.createElement("div");
      track.className = "bar-track";

      var pctM = Math.round((t.monthly / mx) * 100);
      var pctL = Math.round((t.lump / mx) * 100);

      if (t.monthly > 0) {
        var segM = document.createElement("span");
        segM.className = "seg seg-month" + (t.lump > 0 ? "" : " only");
        if (t.monthly > 0) {
          segM.style.width = "calc(" + pctM + "% - 1px)";
          segM.dataset.tip = "Monthly: ৳" + nf(t.monthly);
        }
        track.appendChild(segM);
      }
      if (t.lump > 0) {
        var segL = document.createElement("span");
        segL.className = "seg seg-lump" + (t.monthly > 0 ? "" : " only");
        segL.style.width = "calc(" + pctL + "% - 1px)";
        segL.dataset.tip = "Lump sum: ৳" + nf(t.lump);
        track.appendChild(segL);
      }
      if (track.childNodes.length === 0) {
        var gap = document.createElement("span");
        gap.style.display = "inline-block";
        gap.style.width = "auto";
        gap.style.height = "18px";
        track.appendChild(gap);
      }

      var val = document.createElement("div");
      val.className = "bar-val";
      val.textContent = nf(t.grand);

      row.appendChild(nm);
      row.appendChild(track);
      row.appendChild(val);
      els.chart.appendChild(row);
    });
  }

  function filteredMembers() {
    var q = state.query.trim().toLowerCase();
    var list = state.members.slice();
    if (q) list = list.filter(function (mm) { return mm.name.toLowerCase().indexOf(q) !== -1; });
    if (state.sortKey === "name") {
      list.sort(function (a, b) { return a.name.localeCompare(b.name) * state.sortDir; });
    } else if (state.sortKey === "total") {
      list.sort(function (a, b) {
        var ta = memberTotals(a, 99).grand;
        var tb = memberTotals(b, 99).grand;
        return (ta - tb) * state.sortDir || a.sl - b.sl;
      });
    } else {
      list.sort(function (a, b) { return a.sl - b.sl; });
    }
    return list;
  }

  function colTemplate() {
    var out = '<col class="col-sl"><col class="col-name">';
    for (var m = 0; m < TOTAL_MONTHS; m++) out += '<col class="col-m">';
    out += '<col class="col-total"><col class="col-lump"><col class="col-grand">';
    return out;
  }

  function buildTable() {
    var y = state.year;
    var range = y === 99 ? [0, TOTAL_MONTHS] : YEAR_GROUPS[y];
    var m0 = range[0];
    var mN = range[1];

    els.cols.innerHTML = colTemplate();
    els.head.innerHTML = "";

    // header row 1: year groups
    var gRow = "<tr class='g-head'><th class='col-sl' rowspan='2'>SL</th><th class='col-name' rowspan='2'>NAME</th>";
    if (y === 99) {
      for (var g = 0; g < 4; g++) {
        gRow += "<th class='ycol y20" + (26 + g) + "' colspan='" + (YEAR_GROUPS[g][1] - YEAR_GROUPS[g][0]) + "'>" + "YEAR-" + (2026 + g) + "</th>";
      }
    } else {
      gRow += "<th class='ycol y20" + (26 + y) + "' colspan='" + (mN - m0) + "'>YEAR-" + (2026 + y) + "</th>";
    }
    gRow += "<th class='sortable' data-sort='total' rowspan='2'>TOTAL / PERSON</th>" +
            "<th rowspan='2'>LUMP SUM</th>" +
            "<th rowspan='2'>GRAND TOTAL</th></tr>";
    els.head.insertAdjacentHTML("beforeend", gRow);

    // header row 2: months
    var mRow = "<tr><th class='col-sl'></th><th class='col-name'></th>";
    for (var m = m0; m < mN; m++) {
      mRow += "<th title='" + MONTH_LABELS[m] + "'>" + shortLabel(MONTH_LABELS[m]) + "</th>";
    }
    mRow += "<th></th><th></th><th></th></tr>";
    els.head.insertAdjacentHTML("beforeend", mRow);

    // body
    var list = filteredMembers();
    var rowsHtml = "";
    list.forEach(function (mm) {
      var cells = "<td class='col-sl'>" + mm.sl + "</td>";
      cells += "<th class='col-name' scope='row'>" + escapeHtml(mm.name) + "</th>";
      for (var i = m0; i < mN; i++) {
        var p = paidAt(mm, i);
        var inner = "";
        if (p && p.amt > 0) {
          inner += "<span class='chip-month'>" + nf(p.amt) + "</span>";
          if (p.lump > 0) inner += "<span class='chip-lump'>L" + nf(p.lump) + "</span>";
        }
        cells += "<td>" + (inner ? "<span class='mc'>" + inner + "</span>" : "") + "</td>";
      }
      var t = memberTotals(mm, y);
      cells += "<td class='tt'>" + nf(t.monthly) + "</td>";
      cells += "<td class='tl'>" + nf(t.lump) + "</td>";
      cells += "<td class='tg'>" + nf(t.grand) + "</td>";
      rowsHtml += "<tr>" + cells + "</tr>";
    });
    els.body.innerHTML = rowsHtml || '<tr class="empty-row"><td colspan="' + (3 + (mN - m0) + 3) + '"><p class="empty">No members found.</p></td></tr>';

    // foot
    var t = yearTotals(y);
    var fCells = "<td class='col-sl'></td><td class='col-name'>TOTAL</td>" + ("<td></td>".repeat(mN - m0)) +
                 "<td class='tt'>" + nf(t.monthly) + "</td>" +
                 "<td class='tl'>" + nf(t.lump) + "</td>" +
                 "<td class='tg'>" + nf(t.grand) + "</td>";
    els.foot.innerHTML = "<tr>" + fCells + "</tr>";

    els.head.querySelectorAll("th.sortable").forEach(function (th) {
      th.classList.toggle("sort-asc", th.dataset.sort === state.sortKey && state.sortDir === 1);
      th.classList.toggle("sort-desc", th.dataset.sort === state.sortKey && state.sortDir === -1);
    });
  }

  function shortLabel(label) {
    return label.split(" ")[0];
  }

  function paidAt(member, m) {
    for (var i = 0; i < member.paid.length; i++) {
      if (member.paid[i].m === m) return member.paid[i];
    }
    return null;
  }

  function yearTotals(y) {
    var monthly = 0, lump = 0;
    state.members.forEach(function (mm) {
      var t = memberTotals(mm, y);
      monthly += t.monthly;
      lump += t.lump;
    });
    return { monthly: monthly, lump: lump, grand: monthly + lump };
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    renderStats();
    renderChart();
    buildTable();
  }

  /* ---------- tooltip ---------- */

  function initTooltip() {
    var tip = els.tip;
    els.chart.addEventListener("mouseover", function (e) {
      var seg = e.target.closest(".seg");
      if (!seg || !seg.dataset.tip) return;
      tip.textContent = seg.dataset.tip;
      tip.classList.add("show");
    });
    els.chart.addEventListener("mousemove", function (e) {
      tip.style.left = e.clientX + "px";
      tip.style.top = (e.clientY - 30) + "px";
    });
    els.chart.addEventListener("mouseout", function (e) {
      if (e.target.closest(".seg")) tip.classList.remove("show");
    });
  }

  /* ---------- interactions ---------- */

  function initTabs() {
    els.tabs.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab");
      if (!btn || btn.classList.contains("active")) return;
      els.tabs.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      btn.classList.add("active");
      state.year = parseInt(btn.dataset.yr, 10);
      render();
    });
  }

  function initSearch() {
    els.search.addEventListener("input", function () {
      state.query = els.search.value;
      render();
    });
  }

  function initSort() {
    els.head.addEventListener("click", function (e) {
      var th = e.target.closest("th.sortable");
      if (!th) return;
      var key = th.dataset.sort;
      if (state.sortKey === key) state.sortDir = -state.sortDir;
      else { state.sortKey = key; state.sortDir = 1; }
      render();
    });
  }

  function initRefresh() {
    els.refresh.addEventListener("click", function () {
      els.refresh.disabled = true;
      els.refresh.classList.add("spin");
      fetchMembers(function (list, kind) {
        applyLive(list, kind);
        setTimeout(function () {
          els.refresh.disabled = false;
          els.refresh.classList.remove("spin");
        }, 500);
      });
    });
  }

  function init() {
    render();
    initTooltip();
    initTabs();
    initSearch();
    initSort();
    initRefresh();
    setInterval(function () {
      fetchMembers(function (list, kind) { applyLive(list, kind); });
    }, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();