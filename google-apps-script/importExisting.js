/**
 * Google Apps Script — Run this ONCE to import all existing form responses.
 * 
 * Steps:
 *   1. Open your Google Form's response spreadsheet
 *   2. Go to Extensions → Apps Script
 *   3. Paste this code in a new file (e.g. importExisting.gs)
 *   4. Replace WEBHOOK_URL with your deployed app URL
 *   5. Replace WEBHOOK_SECRET with your APP_WEBHOOK_SECRET
 *   6. Run the function `importAllExistingResponses`
 *   7. Check the Execution Log for results
 */

const IMPORT_URL = "https://YOUR_DEPLOYED_APP.vercel.app/api/import";
const IMPORT_SECRET = "YOUR_APP_WEBHOOK_SECRET";

function importAllExistingResponses() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var value = data[i][j];
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        value = value.toISOString();
      }
      row[headers[j]] = value;
    }
    rows.push(row);
  }

  Logger.log("Total rows to import: " + rows.length);

  // Send in batches of 50 to avoid timeouts
  var batchSize = 50;
  var totalImported = 0;
  var totalFailed = 0;

  for (var start = 0; start < rows.length; start += batchSize) {
    var batch = rows.slice(start, start + batchSize);

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ rows: batch, secret: IMPORT_SECRET }),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(IMPORT_URL, options);
    var result = JSON.parse(response.getContentText());

    Logger.log(
      "Batch " + (Math.floor(start / batchSize) + 1) + 
      ": imported=" + result.imported + " failed=" + result.failed
    );

    totalImported += result.imported;
    totalFailed += result.failed;

    // Log any failures
    if (result.results) {
      result.results.forEach(function(r) {
        if (!r.ok) {
          Logger.log("  Row " + (start + r.index + 2) + " failed: " + r.error);
        }
      });
    }
  }

  Logger.log("=== DONE === Imported: " + totalImported + " | Failed: " + totalFailed);
}
