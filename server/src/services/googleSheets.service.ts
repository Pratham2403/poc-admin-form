import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SERVICE_ACCOUNT_FILE = path.join(
  __dirname,
  "../config/google-service-account.config.json"
);

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

export const getSheetIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const appendToSheet = async (spreadsheetIdOrUrl: string, row: any[]) => {
  try {
    const spreadsheetId =
      getSheetIdFromUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    const updatedRange = response.data.updates?.updatedRange;
    if (updatedRange) {
      // Range format: Sheet1!A5:E5
      const match = updatedRange.match(/[A-Z]+(\d+):/);
      if (match) {
        return parseInt(match[1], 10);
      }
      // Fallback if range is just one cell or different format
      const match2 = updatedRange.match(/[A-Z]+(\d+)/);
      if (match2) {
        return parseInt(match2[1], 10);
      }
    }
    return null;
  } catch (error) {
    console.error("Error appending to sheet:", error);
    throw error;
  }
};

export const updateSheetRow = async (
  spreadsheetIdOrUrl: string,
  rowNumber: number,
  row: any[]
) => {
  try {
    const spreadsheetId =
      getSheetIdFromUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${rowNumber}`, // 1-based index
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating sheet:", error);
    throw error;
  }
};
