/**
 * DeboisTech enquiries: Google Sheets web app.
 * Setup: see chatbot-setup.md. Set SECRET under Project Settings > Script properties.
 */
var SHEET_NAME = "Enquiries";
var HEADERS = ["created_at", "id", "status", "lead_status", "lead_score", "recommended_service", "name", "email", "phone", "project_type", "project_description", "timeline", "source"];

function secret_() {
  return PropertiesService.getScriptProperties().getProperty("SECRET");
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Cells starting with = + - @ would run as formulas; the apostrophe forces text.
function safe_(v) {
  var s = v === null || v === undefined ? "" : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return out_({ ok: true, service: "deboistech-enquiries" });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return out_({ ok: false, error: "bad_json" });
  }
  var expected = secret_();
  if (!expected || body.secret !== expected) return out_({ ok: false, error: "unauthorized" });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    if (body.action === "create") {
      var r = body.record || {};
      sh.appendRow(HEADERS.map(function (h) { return safe_(r[h]); }));
      return out_({ ok: true, id: r.id });
    }
    if (body.action === "list") {
      var rows = sh.getDataRange().getValues();
      var head = rows.shift();
      return out_({
        ok: true,
        rows: rows.map(function (row) {
          var o = {};
          head.forEach(function (h, i) { o[h] = row[i]; });
          return o;
        }),
      });
    }
    if (body.action === "setStatus") {
      var data = sh.getDataRange().getValues();
      var idCol = HEADERS.indexOf("id");
      var statusCol = HEADERS.indexOf("status");
      for (var i = 1; i < data.length; i++) {
        if (data[i][idCol] === body.id) {
          sh.getRange(i + 1, statusCol + 1).setValue(safe_(body.status));
          return out_({ ok: true });
        }
      }
      return out_({ ok: false, error: "not_found" });
    }
    return out_({ ok: false, error: "unknown_action" });
  } finally {
    lock.releaseLock();
  }
}

// Run once from the editor to confirm the sheet is writable.
function testCreate() {
  var r = { created_at: new Date().toISOString(), id: "test-" + Date.now(), status: "NEW", lead_status: "COLD", lead_score: 0, recommended_service: "Software Engineering", name: "Test", email: "test@example.com", phone: "", project_type: "Website", project_description: "=1+1 (formula guard check)", timeline: "Not decided", source: "testCreate" };
  sheet_().appendRow(HEADERS.map(function (h) { return safe_(r[h]); }));
  Logger.log("Row added");
}
