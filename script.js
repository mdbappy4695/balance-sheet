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

  /* Paste your Apps Script web app URL after deploy. Must match ADMIN_PASSWORD in Code.gs */
  var ADMIN_API_URL = "https://script.google.com/macros/s/AKfycbywueG2jhRRehtjNatklac0pYXP6VeU7lwJgxEnHNeX4FYhYlxWYp55pNPwLw1aRQ0rQw/exec";
  var ADMIN_PASSWORD = "change-me";
  var ADMIN_SESSION_KEY = "admin-unlocked";
  var SYNC_MS = 5000;
  var ADMIN_API_MISSING =
    "Set ADMIN_API_URL in script.js after deploying Apps Script (required to update Google Sheet)";

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
    sortDir: 1,
    adminSelectedSl: null,
    lastFingerprint: "",
    syncTimer: null,
    toastTimer: null
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
    tip: document.getElementById("chart-tip"),
    duesAlert: document.getElementById("dues-alert"),
    duesPending: document.getElementById("dues-pending"),
    duesPendingLabel: document.getElementById("dues-pending-label"),
    duesPaidMonth: document.getElementById("dues-paid-month"),
    duesPaidLabel: document.getElementById("dues-paid-label"),
    duesPaidRow: document.getElementById("dues-paid-row"),
    duesDismiss: document.getElementById("dues-alert-dismiss"),
    adminOpen: document.getElementById("admin-open"),
    adminModal: document.getElementById("admin-modal"),
    adminLogin: document.getElementById("admin-login"),
    adminPanel: document.getElementById("admin-panel"),
    adminPassword: document.getElementById("admin-password"),
    adminLoginBtn: document.getElementById("admin-login-btn"),
    adminLoginError: document.getElementById("admin-login-error"),
    adminLogout: document.getElementById("admin-logout"),
    adminStatus: document.getElementById("admin-status"),
    adminMemberList: document.getElementById("admin-member-list"),
    adminNewName: document.getElementById("admin-new-name"),
    adminAddMember: document.getElementById("admin-add-member"),
    adminEdit: document.getElementById("admin-edit"),
    adminEditName: document.getElementById("admin-edit-name"),
    adminRename: document.getElementById("admin-rename"),
    adminDelete: document.getElementById("admin-delete"),
    adminBulkNames: document.getElementById("admin-bulk-names"),
    adminBulkMonths: document.getElementById("admin-bulk-months"),
    adminBulkYears: document.getElementById("admin-bulk-years"),
    adminBulkAmt: document.getElementById("admin-bulk-amt"),
    adminBulkLump: document.getElementById("admin-bulk-lump"),
    adminSavePayments: document.getElementById("admin-save-payments"),
    adminToast: document.getElementById("admin-toast")
  };

  var DUES_DISMISS_KEY = "dues-alert-dismissed";

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

  function looksLikeHtml(txt) {
    var t = String(txt || "")
      .trim()
      .slice(0, 280)
      .toLowerCase();
    return (
      t.indexOf("<!doctype") === 0 ||
      t.indexOf("<html") === 0 ||
      t.indexOf("<html") !== -1 ||
      t.indexOf("<head") !== -1
    );
  }

  function parseAppsScriptJson(txt) {
    if (looksLikeHtml(txt)) {
      throw new Error(
        "Apps Script needs Allow once — open /exec URL and authorize"
      );
    }
    try {
      return JSON.parse(txt);
    } catch (e) {
      throw new Error(
        "Bad Apps Script response — Redeploy Web app (New version) and paste new /exec URL"
      );
    }
  }

  function fetchMembersViaApi(cb) {
    if (!ADMIN_API_URL) {
      cb(null, "offline", "ADMIN_API_URL not set");
      return;
    }
    // POST → doPost (list). Avoids GET/doGet so old deployments without doGet still work once list is in doPost.
    fetch(ADMIN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "list" }),
      redirect: "follow",
      cache: "no-store"
    })
      .then(function (r) {
        if (r.status === 404) {
          throw new Error(
            "Apps Script URL 404 — Deploy Web app again and update ADMIN_API_URL"
          );
        }
        return r.text().then(function (txt) {
          return parseAppsScriptJson(txt);
        });
      })
      .then(function (data) {
        if (!data || !data.ok) {
          cb(
            null,
            "offline",
            (data && data.error) || "Apps Script list failed"
          );
          return;
        }
        if (!data.members || !data.members.length) {
          cb(null, "offline", "Apps Script returned no members (check NAME header)");
          return;
        }
        cb(data.members, "live", null);
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : "Apps Script network error";
        if (msg === "Failed to fetch") {
          msg =
            "Apps Script unreachable — Paste Code.gs, Deploy New version (Anyone + Me), Allow once";
        }
        cb(null, "offline", msg);
      });
  }

  function fetchMembersFromCsv(cb) {
    fetch(CSV_URL, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) {
          throw new Error(
            "Sheet HTTP " + r.status + " — CSV needs public link or use Apps Script"
          );
        }
        return r.text();
      })
      .then(function (txt) {
        if (looksLikeHtml(txt)) {
          throw new Error(
            "Sheet Restricted — use Apps Script list (redeploy Code.gs)"
          );
        }
        var list = parseSheetCsv(txt);
        if (!list || list.length === 0) {
          throw new Error("Sheet parse failed — need a header row with NAME");
        }
        cb(list, "live", null);
      })
      .catch(function (err) {
        var csvErr = err && err.message ? err.message : "CSV fetch failed";
        loadViaJsonp(function (tbl) {
          if (!tbl) {
            cb(null, "offline", csvErr);
            return;
          }
          var list = fromGviz(tbl);
          if (!list || list.length === 0) {
            cb(null, "offline", csvErr + " · gviz also failed");
            return;
          }
          cb(list, "live", null);
        });
      });
  }

  function fetchMembers(cb) {
    // Primary: Apps Script (works with Restricted sheet when Execute as Me)
    fetchMembersViaApi(function (list, kind, errMsg) {
      if (list && list.length) {
        cb(list, kind, null);
        return;
      }
      // Fallback: public CSV / gviz (only if sheet is shared publicly)
      fetchMembersFromCsv(function (list2, kind2, errMsg2) {
        if (list2 && list2.length) {
          cb(list2, kind2, null);
          return;
        }
        cb(
          null,
          "offline",
          errMsg ||
            errMsg2 ||
            "Could not load sheet — redeploy Apps Script with list action"
        );
      });
    });
  }

  function membersFingerprint(list) {
    var copy = (list || []).slice().sort(function (a, b) { return a.sl - b.sl; });
    return JSON.stringify(
      copy.map(function (mm) {
        return {
          sl: mm.sl,
          name: mm.name,
          paid: (mm.paid || [])
            .slice()
            .sort(function (a, b) { return a.m - b.m; })
            .map(function (p) {
              return { m: p.m, amt: p.amt || 0, lump: p.lump || 0 };
            })
        };
      })
    );
  }

  function liveStatusLabel(source, errMsg) {
    if (source === "offline") {
      return errMsg
        ? "Offline — " + errMsg
        : "Offline — showing last data (check sheet sharing)";
    }
    var now = new Date();
    var hh = ("0" + now.getHours()).slice(-2);
    var mm = ("0" + now.getMinutes()).slice(-2);
    var ss = ("0" + now.getSeconds()).slice(-2);
    return "Live · updated " + hh + ":" + mm + ":" + ss;
  }

  function applyLive(list, source, errMsg) {
    if (!list || list.length === 0) {
      setStatus(
        "offline",
        liveStatusLabel(
          "offline",
          errMsg || "Could not load Google Sheet — Share: Anyone with the link"
        )
      );
      return;
    }
    var fp = membersFingerprint(list);
    var label = liveStatusLabel(source, errMsg);
    if (fp === state.lastFingerprint) {
      setStatus(source === "offline" ? "offline" : "live", label);
      return;
    }
    state.lastFingerprint = fp;
    state.members = list;
    render();
    setStatus(source === "offline" ? "offline" : "live", label);
  }

  function syncFromSheet(force) {
    if (shouldSkipLiveSync()) return;
    if (force) state.lastFingerprint = "";
    fetchMembers(function (list, kind, errMsg) {
      applyLive(list, kind, errMsg);
    });
  }

  function startSyncTimer() {
    if (state.syncTimer) return;
    state.syncTimer = setInterval(syncFromSheet, SYNC_MS);
  }

  function stopSyncTimer() {
    if (!state.syncTimer) return;
    clearInterval(state.syncTimer);
    state.syncTimer = null;
  }

  function initLiveSync() {
    syncFromSheet();
    if (document.visibilityState === "visible") startSyncTimer();
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        syncFromSheet();
        startSyncTimer();
      } else {
        stopSyncTimer();
      }
    });
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
    var runningIdx = currentMonthIndex();
    var list = filteredMembers();
    var rowsHtml = "";
    list.forEach(function (mm) {
      var cells = "<td class='col-sl'>" + mm.sl + "</td>";
      cells += "<th class='col-name' scope='row'>" + escapeHtml(mm.name) + "</th>";
      for (var i = m0; i < mN; i++) {
        var p = paidAt(mm, i);
        var inner = "";
        var dueCell = false;
        if (p && p.amt > 0) {
          inner += "<span class='chip-month'>" + nf(p.amt) + "</span>";
          if (p.lump > 0) inner += "<span class='chip-lump'>L" + nf(p.lump) + "</span>";
        } else if (i < runningIdx) {
          inner = "<span class='chip-due'>Due</span>";
          dueCell = true;
        }
        cells +=
          "<td" +
          (dueCell ? " class='due-cell'" : "") +
          ">" +
          (inner ? "<span class='mc'>" + inner + "</span>" : "") +
          "</td>";
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

  /* ---------- unpaid dues (skip running month) ---------- */

  function currentMonthIndex() {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var startAbs = START_YEAR * 12 + START_MONTH;
    var nowAbs = y * 12 + m;
    return nowAbs - startAbs;
  }

  function groupTypicalMonthly() {
    var counts = {};
    var bestAmt = 2000;
    var bestN = 0;
    state.members.forEach(function (mm) {
      mm.paid.forEach(function (p) {
        if (!(p.amt > 0)) return;
        var key = String(p.amt);
        counts[key] = (counts[key] || 0) + 1;
        if (counts[key] > bestN) {
          bestN = counts[key];
          bestAmt = p.amt;
        }
      });
    });
    return bestAmt;
  }

  function typicalMonthly(member) {
    var latest = 0;
    var latestM = -1;
    member.paid.forEach(function (p) {
      if (p.amt > 0 && p.m >= latestM) {
        latestM = p.m;
        latest = p.amt;
      }
    });
    if (latest > 0) return latest;
    return groupTypicalMonthly();
  }

  function unpaidMembers() {
    var running = currentMonthIndex();
    var endExclusive;
    if (running <= 0) return [];
    if (running >= TOTAL_MONTHS) endExclusive = TOTAL_MONTHS;
    else endExclusive = running;

    var out = [];
    state.members.forEach(function (mm) {
      var missed = [];
      for (var mi = 0; mi < endExclusive; mi++) {
        var p = paidAt(mm, mi);
        if (!p || !(p.amt > 0)) missed.push(MONTH_LABELS[mi]);
      }
      if (missed.length > 0) {
        var rate = typicalMonthly(mm);
        out.push({
          sl: mm.sl,
          name: mm.name,
          missed: missed,
          missedCount: missed.length,
          owed: missed.length * rate
        });
      }
    });
    out.sort(function (a, b) { return a.sl - b.sl; });
    return out;
  }

  function paidThisMonth() {
    var m = currentMonthIndex();
    if (m < 0 || m >= TOTAL_MONTHS) return [];
    var out = [];
    state.members.forEach(function (mm) {
      var p = paidAt(mm, m);
      if (p && p.amt > 0) out.push({ sl: mm.sl, name: mm.name });
    });
    out.sort(function (a, b) { return a.sl - b.sl; });
    return out;
  }

  function formatMissedShort(missedLabels) {
    if (!missedLabels || !missedLabels.length) return "";
    var idxs = [];
    missedLabels.forEach(function (label) {
      var i = MONTH_LABELS.indexOf(label);
      if (i >= 0 && idxs.indexOf(i) === -1) idxs.push(i);
    });
    idxs.sort(function (a, b) { return a - b; });
    if (!idxs.length) return "";

    if (idxs.length === 1) return MONTH_LABELS[idxs[0]];

    var consecutive = true;
    for (var c = 1; c < idxs.length; c++) {
      if (idxs[c] !== idxs[c - 1] + 1) {
        consecutive = false;
        break;
      }
    }

    var firstParts = MONTH_LABELS[idxs[0]].split(" ");
    var lastParts = MONTH_LABELS[idxs[idxs.length - 1]].split(" ");
    if (consecutive) {
      if (firstParts[1] === lastParts[1]) {
        return firstParts[0] + "–" + lastParts[0];
      }
      return (
        firstParts[0] +
        " " +
        String(firstParts[1]).slice(-2) +
        "–" +
        lastParts[0] +
        " " +
        String(lastParts[1]).slice(-2)
      );
    }

    var parts = idxs.map(function (idx) {
      return MONTH_LABELS[idx].split(" ")[0];
    });
    if (parts.length <= 3) return parts.join(", ");
    return parts.slice(0, 3).join(", ") + " +" + (parts.length - 3);
  }

  function duesChipHtml(items, kind) {
    if (!items.length) return '<span class="dues-empty">—</span>';
    return items
      .map(function (item) {
        var name = typeof item === "string" ? item : item.name;
        var months = typeof item === "string" ? "" : item.months || "";
        var inner =
          '<span class="dues-chip-name">' + escapeHtml(name) + "</span>";
        if (months) {
          inner +=
            '<span class="dues-chip-m">' + escapeHtml(months) + "</span>";
        }
        return '<span class="dues-chip ' + kind + '">' + inner + "</span>";
      })
      .join("");
  }

  function renderDuesAlert() {
    if (!els.duesAlert) return;
    var dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DUES_DISMISS_KEY) === "1";
    } catch (e) { /* ignore */ }

    var running = currentMonthIndex();
    if (dismissed || running < 0) {
      els.duesAlert.hidden = true;
      return;
    }

    var pending = unpaidMembers();
    var paid = paidThisMonth();
    var schemeEnded = running >= TOTAL_MONTHS;

    if (els.duesPendingLabel) {
      els.duesPendingLabel.textContent = "Pending (" + pending.length + ")";
    }
    if (els.duesPending) {
      els.duesPending.innerHTML = duesChipHtml(
        pending.map(function (u) {
          return { name: u.name, months: formatMissedShort(u.missed) };
        }),
        "due"
      );
    }

    if (els.duesPaidRow) {
      if (schemeEnded) {
        els.duesPaidRow.hidden = true;
      } else {
        els.duesPaidRow.hidden = false;
        var label = MONTH_LABELS[running] || "this month";
        if (els.duesPaidLabel) {
          els.duesPaidLabel.textContent = "Paid " + label + " (" + paid.length + ")";
        }
        if (els.duesPaidMonth) {
          els.duesPaidMonth.innerHTML = duesChipHtml(
            paid.map(function (u) { return { name: u.name }; }),
            "paid"
          );
        }
      }
    }

    els.duesAlert.hidden = false;
  }

  function render() {
    renderStats();
    renderDuesAlert();
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

  function shouldSkipLiveSync() {
    return false;
  }

  function initRefresh() {
    els.refresh.addEventListener("click", function () {
      els.refresh.disabled = true;
      els.refresh.classList.add("spin");
      state.lastFingerprint = "";
      fetchMembers(function (list, kind, errMsg) {
        applyLive(list, kind, errMsg);
        setTimeout(function () {
          els.refresh.disabled = false;
          els.refresh.classList.remove("spin");
        }, 500);
      });
    });
  }

  function initDuesDismiss() {
    if (!els.duesDismiss) return;
    els.duesDismiss.addEventListener("click", function () {
      try {
        sessionStorage.setItem(DUES_DISMISS_KEY, "1");
      } catch (e) { /* ignore */ }
      els.duesAlert.hidden = true;
    });
  }

  /* ---------- admin ---------- */

  function isAdminUnlocked() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setAdminUnlocked(on) {
    try {
      if (on) sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      else sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) { /* ignore */ }
  }

  function setAdminStatus(msg, kind) {
    if (!els.adminStatus) return;
    els.adminStatus.textContent = msg || "";
    els.adminStatus.className = "admin-status" + (kind ? " " + kind : "");
  }

  function showAdminToast(msg, kind) {
    if (!els.adminToast || !msg) return;
    els.adminToast.hidden = false;
    els.adminToast.textContent = msg;
    els.adminToast.className = "admin-toast" + (kind ? " " + kind : "");
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      els.adminToast.hidden = true;
      state.toastTimer = null;
    }, 2500);
  }

  function requireAdminApi() {
    if (ADMIN_API_URL) return true;
    setAdminStatus(ADMIN_API_MISSING, "err");
    showAdminToast(ADMIN_API_MISSING, "err");
    return false;
  }

  function clearBulkPaymentForm() {
    if (els.adminBulkAmt) els.adminBulkAmt.value = "";
    if (els.adminBulkLump) els.adminBulkLump.value = "";
    [els.adminBulkNames, els.adminBulkMonths, els.adminBulkYears].forEach(function (sel) {
      if (!sel) return;
      Array.prototype.forEach.call(sel.options, function (opt) {
        opt.selected = false;
      });
    });
  }

  function showAdminLoginError(msg) {
    if (!els.adminLoginError) return;
    if (!msg) {
      els.adminLoginError.hidden = true;
      els.adminLoginError.textContent = "";
      return;
    }
    els.adminLoginError.hidden = false;
    els.adminLoginError.textContent = msg;
  }

  function openAdminModal() {
    if (!els.adminModal) return;
    els.adminModal.hidden = false;
    document.body.classList.add("admin-open");
    if (isAdminUnlocked()) showAdminPanel();
    else showAdminLogin();
  }

  function closeAdminModal() {
    if (!els.adminModal) return;
    els.adminModal.hidden = true;
    document.body.classList.remove("admin-open");
  }

  function showAdminLogin() {
    els.adminLogin.hidden = false;
    els.adminPanel.hidden = true;
    showAdminLoginError("");
    if (els.adminPassword) {
      els.adminPassword.value = "";
      els.adminPassword.focus();
    }
  }

  function showAdminPanel() {
    els.adminLogin.hidden = true;
    els.adminPanel.hidden = false;
    setAdminStatus("");
    renderAdminMemberList();
    fillBulkNameOptions();
    if (state.adminSelectedSl != null) selectAdminMember(state.adminSelectedSl);
    else els.adminEdit.hidden = true;
  }

  function adminRequest(action, payload, cb) {
    if (!ADMIN_API_URL) {
      cb({ ok: false, error: ADMIN_API_MISSING });
      return;
    }
    var body = {};
    Object.keys(payload || {}).forEach(function (k) {
      body[k] = payload[k];
    });
    body.action = action;
    body.password = ADMIN_PASSWORD;

    fetch(ADMIN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow"
    })
      .then(function (r) {
        return r.text().then(function (txt) {
          if (looksLikeHtml(txt)) {
            throw new Error(
              "Apps Script needs Allow once — open the /exec URL in browser and authorize"
            );
          }
          try {
            return JSON.parse(txt);
          } catch (e) {
            throw new Error(
              "Bad Apps Script response — Redeploy Web app (Anyone) and try again"
            );
          }
        });
      })
      .then(function (data) {
        if (!data || typeof data !== "object") {
          cb({ ok: false, error: "Empty response from Apps Script" });
          return;
        }
        if (!data.ok && data.error) {
          cb({ ok: false, error: String(data.error) });
          return;
        }
        cb(data);
      })
      .catch(function (err) {
        cb({ ok: false, error: err && err.message ? err.message : "Network error" });
      });
  }

  function refreshAfterWrite(cb) {
    state.lastFingerprint = "";
    fetchMembers(function (list, kind, errMsg) {
      applyLive(list, kind, errMsg);
      renderAdminMemberList();
      if (state.adminSelectedSl != null) selectAdminMember(state.adminSelectedSl);
      if (cb) cb();
    });
  }

  function findMemberBySl(sl) {
    for (var i = 0; i < state.members.length; i++) {
      if (state.members[i].sl === sl) return state.members[i];
    }
    return null;
  }

  function renderAdminMemberList() {
    if (!els.adminMemberList) return;
    var html = "";
    var list = state.members.slice().sort(function (a, b) { return a.sl - b.sl; });
    list.forEach(function (mm) {
      var active = state.adminSelectedSl === mm.sl ? " active" : "";
      html +=
        '<li><button type="button" class="admin-member-item' +
        active +
        '" data-sl="' +
        mm.sl +
        '"><span class="admin-sl">#' +
        mm.sl +
        "</span> " +
        escapeHtml(mm.name) +
        "</button></li>";
    });
    els.adminMemberList.innerHTML = html || '<li class="admin-empty">No members</li>';
    fillBulkNameOptions();
  }

  function fillBulkNameOptions() {
    if (!els.adminBulkNames) return;
    var selected = {};
    Array.prototype.forEach.call(els.adminBulkNames.selectedOptions || [], function (opt) {
      selected[opt.value] = true;
    });
    var html = "";
    state.members
      .slice()
      .sort(function (a, b) { return a.sl - b.sl; })
      .forEach(function (mm) {
        html +=
          '<option value="' +
          mm.sl +
          '"' +
          (selected[String(mm.sl)] ? " selected" : "") +
          ">" +
          escapeHtml(mm.name) +
          "</option>";
      });
    els.adminBulkNames.innerHTML = html;
  }

  function selectAdminMember(sl) {
    state.adminSelectedSl = sl;
    var mm = findMemberBySl(sl);
    renderAdminMemberList();
    if (!mm) {
      els.adminEdit.hidden = true;
      return;
    }
    els.adminEdit.hidden = false;
    els.adminEditName.value = mm.name;
  }

  function selectedMultiValues(selectEl) {
    var out = [];
    if (!selectEl) return out;
    Array.prototype.forEach.call(selectEl.selectedOptions || [], function (opt) {
      out.push(opt.value);
    });
    return out;
  }

  function monthIndexFor(calMonth, year) {
    var labelNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var label = labelNames[calMonth] + " " + year;
    for (var i = 0; i < MONTH_LABELS.length; i++) {
      if (MONTH_LABELS[i] === label) return i;
    }
    return -1;
  }

  function expandBulkMonthIndexes(monthVals, yearVals) {
    var idxs = [];
    var skipped = 0;
    monthVals.forEach(function (mv) {
      var calM = parseInt(mv, 10);
      yearVals.forEach(function (yv) {
        var y = parseInt(yv, 10);
        var idx = monthIndexFor(calM, y);
        if (idx < 0) skipped++;
        else if (idxs.indexOf(idx) === -1) idxs.push(idx);
      });
    });
    idxs.sort(function (a, b) { return a - b; });
    return { indexes: idxs, skipped: skipped };
  }

  function saveBulkPaymentsForMembers(slList, payments, done) {
    var i = 0;
    var errors = [];
    function next() {
      if (i >= slList.length) {
        done(errors);
        return;
      }
      var sl = slList[i++];
      var label = (findMemberBySl(sl) || {}).name || "#" + sl;
      adminRequest("setPayments", { sl: sl, payments: payments }, function (res) {
        if (!res.ok) {
          errors.push({
            name: label,
            error: res.error || "Save failed"
          });
        }
        next();
      });
    }
    next();
  }

  function initAdmin() {
    if (!els.adminOpen || !els.adminModal) return;

    els.adminOpen.addEventListener("click", openAdminModal);

    els.adminModal.addEventListener("click", function (e) {
      if (e.target.closest("[data-admin-close]")) closeAdminModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && els.adminModal && !els.adminModal.hidden) closeAdminModal();
    });

    els.adminLoginBtn.addEventListener("click", function () {
      var pw = (els.adminPassword.value || "").trim();
      if (pw !== ADMIN_PASSWORD) {
        showAdminLoginError("Wrong password");
        return;
      }
      setAdminUnlocked(true);
      showAdminPanel();
      if (ADMIN_API_URL) {
        setAdminStatus("Unlocked — edits write to Google Sheet", "ok");
      } else {
        setAdminStatus(ADMIN_API_MISSING, "err");
        showAdminToast(ADMIN_API_MISSING, "err");
      }
    });

    els.adminPassword.addEventListener("keydown", function (e) {
      if (e.key === "Enter") els.adminLoginBtn.click();
    });

    els.adminLogout.addEventListener("click", function () {
      setAdminUnlocked(false);
      state.adminSelectedSl = null;
      showAdminLogin();
    });

    els.adminMemberList.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-member-item");
      if (!btn) return;
      selectAdminMember(parseInt(btn.dataset.sl, 10));
    });

    els.adminAddMember.addEventListener("click", function () {
      if (!requireAdminApi()) return;
      var name = (els.adminNewName.value || "").trim();
      if (!name) {
        setAdminStatus("Enter a member name", "err");
        return;
      }
      els.adminAddMember.disabled = true;
      setAdminStatus("Adding…");
      adminRequest("addMember", { name: name }, function (res) {
        els.adminAddMember.disabled = false;
        if (!res.ok) {
          setAdminStatus(res.error || "Add failed", "err");
          showAdminToast(res.error || "Add failed", "err");
          return;
        }
        els.adminNewName.value = "";
        setAdminStatus("Added " + name + " to Google Sheet", "ok");
        showAdminToast("Added " + name + " to Google Sheet", "ok");
        refreshAfterWrite(function () {
          if (res.sl) selectAdminMember(res.sl);
        });
      });
    });

    els.adminRename.addEventListener("click", function () {
      if (!requireAdminApi()) return;
      if (state.adminSelectedSl == null) return;
      var name = (els.adminEditName.value || "").trim();
      if (!name) {
        setAdminStatus("Name required", "err");
        return;
      }
      els.adminRename.disabled = true;
      setAdminStatus("Renaming…");
      adminRequest("renameMember", { sl: state.adminSelectedSl, name: name }, function (res) {
        els.adminRename.disabled = false;
        if (!res.ok) {
          setAdminStatus(res.error || "Rename failed", "err");
          showAdminToast(res.error || "Rename failed", "err");
          return;
        }
        setAdminStatus("Renamed to " + name, "ok");
        showAdminToast("Renamed on Google Sheet", "ok");
        refreshAfterWrite();
      });
    });

    els.adminDelete.addEventListener("click", function () {
      if (!requireAdminApi()) return;
      if (state.adminSelectedSl == null) return;
      var mm = findMemberBySl(state.adminSelectedSl);
      var label = mm ? mm.name : "#" + state.adminSelectedSl;
      if (!window.confirm("Delete member " + label + "? This cannot be undone.")) return;
      els.adminDelete.disabled = true;
      setAdminStatus("Deleting…");
      adminRequest("deleteMember", { sl: state.adminSelectedSl }, function (res) {
        els.adminDelete.disabled = false;
        if (!res.ok) {
          setAdminStatus(res.error || "Delete failed", "err");
          showAdminToast(res.error || "Delete failed", "err");
          return;
        }
        state.adminSelectedSl = null;
        els.adminEdit.hidden = true;
        setAdminStatus("Deleted " + label, "ok");
        showAdminToast("Deleted from Google Sheet", "ok");
        refreshAfterWrite();
      });
    });

    els.adminSavePayments.addEventListener("click", function () {
      if (!requireAdminApi()) return;
      var nameVals = selectedMultiValues(els.adminBulkNames);
      var monthVals = selectedMultiValues(els.adminBulkMonths);
      var yearVals = selectedMultiValues(els.adminBulkYears);
      if (nameVals.length === 0) {
        setAdminStatus("Select at least one name", "err");
        return;
      }
      if (monthVals.length === 0) {
        setAdminStatus("Select at least one month", "err");
        return;
      }
      if (yearVals.length === 0) {
        setAdminStatus("Select at least one year", "err");
        return;
      }
      var expanded = expandBulkMonthIndexes(monthVals, yearVals);
      if (expanded.indexes.length === 0) {
        setAdminStatus("No valid months in range (JUN 2026 – MAY 2029)", "err");
        return;
      }
      var amt = els.adminBulkAmt.value !== "" ? Number(els.adminBulkAmt.value) : 0;
      var lump = els.adminBulkLump.value !== "" ? Number(els.adminBulkLump.value) : 0;
      if (isNaN(amt)) amt = 0;
      if (isNaN(lump)) lump = 0;
      var payments = expanded.indexes.map(function (m) {
        return { m: m, amt: amt, lump: lump };
      });
      var slList = nameVals.map(function (v) { return parseInt(v, 10); });
      els.adminSavePayments.disabled = true;
      setAdminStatus("Saving payments to Google Sheet…");
      saveBulkPaymentsForMembers(slList, payments, function (errors) {
        els.adminSavePayments.disabled = false;
        if (errors.length === slList.length) {
          var failDetail = errors
            .map(function (e) {
              return e.name + ": " + e.error;
            })
            .join(" · ");
          setAdminStatus(failDetail, "err");
          showAdminToast(failDetail, "err");
          return;
        }
        var msg = "Payments saved to Google Sheet";
        if (expanded.skipped > 0) msg += " · skipped " + expanded.skipped + " out-of-range combo(s)";
        if (errors.length) {
          msg +=
            " · failed: " +
            errors
              .map(function (e) {
                return e.name + " (" + e.error + ")";
              })
              .join(", ");
        }
        setAdminStatus(msg, errors.length ? "err" : "ok");
        showAdminToast(
          errors.length ? msg : "Payments saved to Google Sheet",
          errors.length ? "err" : "ok"
        );
        if (!errors.length) clearBulkPaymentForm();
        refreshAfterWrite();
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
    initDuesDismiss();
    initAdmin();
    initLiveSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();