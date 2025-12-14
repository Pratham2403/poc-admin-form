import { google } from "googleapis";
import logger from "../lib/logger/index.ts";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!SERVICE_ACCOUNT_FILE) {
  throw new Error(
    "Missing required environment variable: GOOGLE_SERVICE_ACCOUNT_JSON"
  );
}

let credentials;
try {
  credentials = JSON.parse(SERVICE_ACCOUNT_FILE);
} catch (error) {
  logger.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", {
    stack: (error as Error).stack,
  });
  throw new Error(
    "Invalid GOOGLE_SERVICE_ACCOUNT_JSON environment variable: Invalid JSON"
  );
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

export const getSheetIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const FIXED_HEADERS = ["ID", "NAME", "EMAIL"];

/**
 * Validates access to the sheet and ensures necessary headers exist.
 * IT IS A MIDDLEWARE FUNCTION THAT IS USED TO VALIDATE THE SHEET ACCESS AND INITIALIZE THE SHEET IF IT IS NOT INITIALIZED.
 */
export const validateAndInitializeSheet = async (
  spreadsheetIdOrUrl: string
): Promise<{ title: string; sheetId: string }> => {
  try {
    const spreadsheetId =
      getSheetIdFromUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitle = metadata.data.properties?.title || "Untitled Sheet";

    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!1:1",
    });

    const existingHeaders = headerResponse.data.values?.[0] || [];

    const isInitialized = FIXED_HEADERS.every(
      (h, i) => existingHeaders[i]?.toUpperCase() === h
    );

    if (!isInitialized) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1:C1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [FIXED_HEADERS] },
      });
    }

    return { title: sheetTitle, sheetId: spreadsheetId };
  } catch (error: any) {
    if (
      error.code === 403 ||
      error.code === 401 ||
      (error.response && [401, 403].includes(error.response.status))
    ) {
      logger.warn(
        `Sheet validation: Permission denied for ${spreadsheetIdOrUrl}`
      );
      throw new Error(
        "Service account does not have access to this sheet. Please share it with the service account email."
      );
    }

    if (
      error.code === 404 ||
      (error.response && error.response.status === 404)
    ) {
      logger.warn(`Sheet validation: Not found ${spreadsheetIdOrUrl}`);
      throw new Error("Spreadsheet not found. Please check the URL.");
    }

    logger.error("Sheet validation unexpected error", {
      context: { error: error.message },
    });
    throw error;
  }
};

/**
 * Syncs a response to the sheet, ensuring columns exist for all questions.
 */
export const syncResponseToSheet = async (
  spreadsheetIdOrUrl: string,
  rowId: string | undefined,
  userData: { id: string; name: string; email: string },
  answers: Record<string, any>,
  questions: { id: string; title: string }[]
): Promise<number> => {
  const spreadsheetId =
    getSheetIdFromUrl(spreadsheetIdOrUrl) || spreadsheetIdOrUrl;

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!1:1",
  });

  let headers = headerResponse.data.values?.[0] || [];

  if (headers.length < 3) {
    headers = [...FIXED_HEADERS, ...headers.slice(3)];
    if (headerResponse.data.values?.[0]?.length === 0) {
      headers = [...FIXED_HEADERS];
    }
  }

  const newHeaders = [...headers];
  let headersChanged = false;

  const questionTitleToHeaderIndex: Record<string, number> = {};
  newHeaders.forEach((h, i) => {
    questionTitleToHeaderIndex[h] = i;
  });

  questions.forEach((q) => {
    const cleanTitle = q.title.trim();
    if (questionTitleToHeaderIndex[cleanTitle] === undefined) {
      newHeaders.push(cleanTitle);
      questionTitleToHeaderIndex[cleanTitle] = newHeaders.length - 1;
      headersChanged = true;
    }
  });

  if (headersChanged) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!1:1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newHeaders] },
    });
  }

  const rowData: string[] = new Array(newHeaders.length).fill("");
  rowData[0] = userData.id;
  rowData[1] = userData.name;
  rowData[2] = userData.email;

  questions.forEach((q) => {
    const cleanTitle = q.title.trim();
    const index = questionTitleToHeaderIndex[cleanTitle];
    if (index !== undefined) {
      const ans = answers[q.id];
      let val = "";
      if (Array.isArray(ans)) {
        val = `'${ans.join(", ")}`;
      } else if (ans !== undefined && ans !== null) {
        val = String(ans);
      }
      rowData[index] = val;
    }
  });

  if (rowId) {
    const rowNum = parseInt(rowId, 10);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowData] },
    });
    return rowNum;
  } else {
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [rowData] },
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
