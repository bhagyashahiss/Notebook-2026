/**
 * Google Apps Script — paste this into the Script Editor
 * attached to the Google Form's response spreadsheet.
 *
 * After pasting:
 *   1. Replace WEBHOOK_URL with your deployed app URL.
 *   2. Replace WEBHOOK_SECRET with the value of APP_WEBHOOK_SECRET from your .env.
 *   3. Click "Triggers" (clock icon) → Add Trigger:
 *        - Function: onFormSubmit
 *        - Event source: From spreadsheet
 *        - Event type: On form submit
 *   4. Authorize the script when prompted.
 */

const WEBHOOK_URL = "https://YOUR_DEPLOYED_APP.vercel.app/api/form-submit";
const WEBHOOK_SECRET = "YOUR_APP_WEBHOOK_SECRET";

function onFormSubmit(e) {
  const headers = e.range.getSheet().getParent().getSheets()[0].getRange(1, 1, 1, e.range.getLastColumn()).getValues()[0];
  const values = e.range.getValues()[0];

  var payload = {};
  for (var i = 0; i < headers.length; i++) {
    payload[headers[i]] = values[i];
  }

  // Ensure Timestamp is a string
  if (payload["Timestamp"] instanceof Date) {
    payload["Timestamp"] = payload["Timestamp"].toISOString();
  }

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": WEBHOOK_SECRET
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  Logger.log("Status: " + response.getResponseCode() + " Body: " + response.getContentText());
}
