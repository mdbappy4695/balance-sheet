/**
 * Balance Sheet Admin API
 *
 * Setup:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this file, set ADMIN_PASSWORD below
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL into script.js as ADMIN_API_URL
 *
 * Frontend should POST JSON as text/plain to avoid CORS preflight.
 */

var ADMIN_PASSWORD = "change-me";
var TOTAL_MONTHS = 36;
var SHEET_NAME = ""; // empty = first sheet / active sheet

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var body = JSON.parse(raw);
    if (!body || body.password !== ADMIN_PASSWORD) {
      return json_({ ok: false, error: "Unauthorized" });
    }
    var action = String(body.action || "");
    var sheet = getSheet_();
    var meta = findHeader_(sheet);
    if (!meta) {
      return json_({ ok: false, error: "Header row with NAME not found" });
    }

    switch (action) {
      case "addMember":
        return json_(addMember_(sheet, meta, body));
      case "deleteMember":
        return json_(deleteMember_(sheet, meta, body));
      case "renameMember":
        return json_(renameMember_(sheet, meta, body));
      case "setPayment":
        return json_(setPayment_(sheet, meta, body));
      case "setPayments":
        return json_(setPayments_(sheet, meta, body));
      case "ping":
        return json_({ ok: true, message: "pong" });
      default:
        return json_({ ok: false, error: "Unknown action: " + action });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return json_({ ok: true, message: "Balance sheet admin API. Use POST." });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (SHEET_NAME) {
    var named = ss.getSheetByName(SHEET_NAME);
    if (named) return named;
  }
  return ss.getSheets()[0];
}

function findHeader_(sheet) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var lastCol = Math.max(sheet.getLastColumn(), 2);
  var values = sheet.getRange(1, 1, lastRow, Math.min(lastCol, 2)).getValues();
  for (var r = 0; r < values.length; r++) {
    var nameCell = String(values[r][1] || "")
      .trim()
      .toUpperCase();
    if (nameCell === "NAME") {
      return { headerRow: r + 1, dataStart: r + 2 };
    }
  }
  return null;
}

function findMemberRow_(sheet, meta, sl) {
  var lastRow = sheet.getLastRow();
  if (lastRow < meta.dataStart) return -1;
  var values = sheet.getRange(meta.dataStart, 1, lastRow, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    var f0 = String(values[i][0] || "").trim();
    if (f0.toUpperCase() === "TOTAL") break;
    if (f0 === String(sl)) return meta.dataStart + i;
  }
  return -1;
}

function nextSl_(sheet, meta) {
  var lastRow = sheet.getLastRow();
  var maxSl = 0;
  if (lastRow >= meta.dataStart) {
    var values = sheet.getRange(meta.dataStart, 1, lastRow, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      var f0 = String(values[i][0] || "").trim();
      if (f0.toUpperCase() === "TOTAL") break;
      if (/^\d+$/.test(f0)) {
        var n = parseInt(f0, 10);
        if (n > maxSl) maxSl = n;
      }
    }
  }
  return maxSl + 1;
}

function findInsertRow_(sheet, meta) {
  var lastRow = sheet.getLastRow();
  if (lastRow < meta.dataStart) return meta.dataStart;
  var values = sheet.getRange(meta.dataStart, 1, lastRow, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    var f0 = String(values[i][0] || "").trim();
    if (f0.toUpperCase() === "TOTAL") return meta.dataStart + i;
  }
  return lastRow + 1;
}

function addMember_(sheet, meta, body) {
  var name = String(body.name || "").trim();
  if (!name) return { ok: false, error: "Name required" };
  var sl = body.sl ? parseInt(body.sl, 10) : nextSl_(sheet, meta);
  if (!sl || isNaN(sl)) return { ok: false, error: "Invalid SL" };
  if (findMemberRow_(sheet, meta, sl) > 0) {
    return { ok: false, error: "SL already exists" };
  }
  var row = findInsertRow_(sheet, meta);
  sheet.insertRowBefore(row);
  sheet.getRange(row, 1).setValue(sl);
  sheet.getRange(row, 2).setValue(name);
  return { ok: true, sl: sl, name: name, row: row };
}

function deleteMember_(sheet, meta, body) {
  var sl = parseInt(body.sl, 10);
  if (!sl || isNaN(sl)) return { ok: false, error: "Invalid SL" };
  var row = findMemberRow_(sheet, meta, sl);
  if (row < 0) return { ok: false, error: "Member not found" };
  sheet.deleteRow(row);
  return { ok: true, sl: sl };
}

function renameMember_(sheet, meta, body) {
  var sl = parseInt(body.sl, 10);
  var name = String(body.name || "").trim();
  if (!sl || isNaN(sl)) return { ok: false, error: "Invalid SL" };
  if (!name) return { ok: false, error: "Name required" };
  var row = findMemberRow_(sheet, meta, sl);
  if (row < 0) return { ok: false, error: "Member not found" };
  sheet.getRange(row, 2).setValue(name);
  return { ok: true, sl: sl, name: name };
}

function monthCols_(m) {
  var mi = parseInt(m, 10);
  if (isNaN(mi) || mi < 0 || mi >= TOTAL_MONTHS) return null;
  var monthlyCol = 3 + mi * 2; // 1-based: col C = month 0
  return { monthlyCol: monthlyCol, lumpCol: monthlyCol + 1, m: mi };
}

function setPayment_(sheet, meta, body) {
  var sl = parseInt(body.sl, 10);
  var cols = monthCols_(body.m);
  if (!sl || isNaN(sl)) return { ok: false, error: "Invalid SL" };
  if (!cols) return { ok: false, error: "Invalid month" };
  var row = findMemberRow_(sheet, meta, sl);
  if (row < 0) return { ok: false, error: "Member not found" };
  var amt = Number(body.amt);
  var lump = Number(body.lump);
  if (isNaN(amt)) amt = 0;
  if (isNaN(lump)) lump = 0;
  sheet.getRange(row, cols.monthlyCol).setValue(amt > 0 ? amt : "");
  sheet.getRange(row, cols.lumpCol).setValue(lump > 0 ? lump : "");
  return { ok: true, sl: sl, m: cols.m, amt: amt, lump: lump };
}

function setPayments_(sheet, meta, body) {
  var sl = parseInt(body.sl, 10);
  if (!sl || isNaN(sl)) return { ok: false, error: "Invalid SL" };
  var row = findMemberRow_(sheet, meta, sl);
  if (row < 0) return { ok: false, error: "Member not found" };
  var payments = body.payments || [];
  for (var i = 0; i < payments.length; i++) {
    var p = payments[i];
    var cols = monthCols_(p.m);
    if (!cols) continue;
    var amt = Number(p.amt);
    var lump = Number(p.lump);
    if (isNaN(amt)) amt = 0;
    if (isNaN(lump)) lump = 0;
    sheet.getRange(row, cols.monthlyCol).setValue(amt > 0 ? amt : "");
    sheet.getRange(row, cols.lumpCol).setValue(lump > 0 ? lump : "");
  }
  return { ok: true, sl: sl, count: payments.length };
}
