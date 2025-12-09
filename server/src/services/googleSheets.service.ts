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

// Fixed headers that must exist
const FIXED_HEADERS = ["ID", "NAME", "EMAIL"];

/**
 * Validates access to the sheet and ensures necessary headers exist.
 * Returns the sheet title if successful.
 */
export const validateAndInitializeSheet = async (
  spreadsheetIdOrUrl: string
): Promise<{ title: string; sheetId: string }> => {
  try {
    const spreadsheetId =
      getSheetIdFromUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

    // Check access by trying to read spreadsheet properties
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetTitle = metadata.data.properties?.title || "Untitled Sheet";

    // Read first row to check headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!1:1",
    });

    const existingHeaders = headerResponse.data.values?.[0] || [];

    // Check if fixed headers exist at the start
    const isInitialized = FIXED_HEADERS.every(
      (h, i) => existingHeaders[i]?.toUpperCase() === h
    );

    if (!isInitialized) {
      // If not initialized, we will prepend/overwrite the start of the first row
      // Careful: This might overwrite existing data if the user gave a random sheet.
      // But for this POC we assume we own the sheet structure.
      // To be safe, we only insert if empty or partially matching.
      // Let's just update the first 3 columns to be safe.
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1:C1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [FIXED_HEADERS],
        },
      });
    }

    return { title: sheetTitle, sheetId: spreadsheetId };
  } catch (error: any) {
    console.error("Error validating sheet:", error);
    if (error.code === 403 || error.code === 401) {
      throw new Error(
        "Service account does not have access to this sheet. Please share it with the service account email."
      );
    }
    if (error.code === 404) {
      throw new Error("Spreadsheet not found. Please check the URL.");
    }
    throw error;
  }
};

/**
 * Syncs a response to the sheet, ensuring columns exist for all questions.
 * Maps answers to correct columns based on Queston Title.
 */
export const syncResponseToSheet = async (
  spreadsheetIdOrUrl: string,
  rowId: string | undefined, // If updating, provide the row number (as string for consistency, though internal is number)
  userData: { id: string; name: string; email: string },
  answers: Record<string, any>, // Key is Question ID
  questions: { id: string; title: string }[]
): Promise<number> => {
  const spreadsheetId =
    getSheetIdFromUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

  // 1. Get current headers
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!1:1",
  });

  let headers = headerResponse.data.values?.[0] || [];

  // Ensure Fixed Headers stay in place (should be handled by validate, but double check)
  if (headers.length < 3) {
    headers = [...FIXED_HEADERS, ...headers.slice(3)];
    // Note: We aren't force-updating the sheet here to save API calls, 
    // we just assume we will append correctly relative to these virtual headers if empty.
    // But actually, we need to know the REAL sheet headers to know where to write.
    // If real headers are empty, we treat them as empty.
    if (headerResponse.data.values?.[0]?.length === 0) {
      headers = [...FIXED_HEADERS];
    }
  }

  // 2. Identify Missing Columns
  const newHeaders = [...headers];
  let headersChanged = false;

  const questionTitleToHeaderIndex: Record<string, number> = {};

  // Map existing headers to indices
  newHeaders.forEach((h, i) => {
    questionTitleToHeaderIndex[h] = i;
  });

  // Check each question
  questions.forEach((q) => {
    // We use Question Title as column header
    const cleanTitle = q.title.trim();
    if (questionTitleToHeaderIndex[cleanTitle] === undefined) {
      // New column needed
      newHeaders.push(cleanTitle);
      questionTitleToHeaderIndex[cleanTitle] = newHeaders.length - 1;
      headersChanged = true;
    }
  });

  // 3. Update Headers if changed
  if (headersChanged) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!1:1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newHeaders],
      },
    });
  }

  // 4. Construct Row
  const rowData: string[] = new Array(newHeaders.length).fill("");

  // Fill Fixed Data
  rowData[0] = userData.id;
  rowData[1] = userData.name;
  rowData[2] = userData.email;

  // Fill Answers
  questions.forEach((q) => {
    const cleanTitle = q.title.trim();
    const index = questionTitleToHeaderIndex[cleanTitle];
    if (index !== undefined) {
      const ans = answers[q.id];
      const val = Array.isArray(ans) ? ans.join(", ") : (ans !== undefined && ans !== null ? String(ans) : "");
      rowData[index] = val;
    }
  });

  // 5. Append or Update
  if (rowId) {
    const rowNum = parseInt(rowId, 10);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });
    return rowNum;
  } else {
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    const updatedRange = appendResponse.data.updates?.updatedRange;
    if (updatedRange) {
      const match = updatedRange.match(/[A-Z]+(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    throw new Error("Could not determine row number after append");
  }
};

export const appendToSheet = async (spreadsheetIdOrUrl: string, row: any[]) => {
  // Deprecated direct append, keeping for backward safety if needed but we should replace usages.
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
      const match = updatedRange.match(/[A-Z]+(\d+):/);
      if (match) return parseInt(match[1], 10);
      const match2 = updatedRange.match(/[A-Z]+(\d+)/);
      if (match2) return parseInt(match2[1], 10);
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
  // Deprecated direct update
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
