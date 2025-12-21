import { google } from "googleapis";
import logger from "../lib/logger/index.ts";
import { AppError } from "../errors/AppError.ts";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!SERVICE_ACCOUNT_FILE) {
  throw AppError.internal(
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
  throw AppError.internal(
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
 * Used by sheetValidation middleware during form creation/update.
 *
 * Note: Response sync to sheets is handled by MongoDB Atlas Triggers.
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
      throw AppError.forbidden(
        "Service account does not have access to this sheet. Please share it with the service account email."
      );
    }

    if (
      error.code === 404 ||
      (error.response && error.response.status === 404)
    ) {
      logger.warn(`Sheet validation: Not found ${spreadsheetIdOrUrl}`);
      throw AppError.notFound("Spreadsheet not found. Please check the URL.");
    }

    logger.error("Sheet validation unexpected error", {
      context: { error: error.message },
    });
    throw error;
  }
};
