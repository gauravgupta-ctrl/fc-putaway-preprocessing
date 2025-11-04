import { google } from 'googleapis';
import type {
  GoogleSheetTransferOrder,
  GoogleSheetTransferOrderLine,
  GoogleSheetSkuAttribute,
} from '@/types/database';

const SPREADSHEET_ID = '1wCPtQV6hQxZtKn-yRkncLnLnJdN5zU3mcRSfHNiHuH0';

export interface GoogleSheetsData {
  transferOrders: GoogleSheetTransferOrder[];
  transferOrderLines: GoogleSheetTransferOrderLine[];
  skuAttributes: GoogleSheetSkuAttribute[];
}

/**
 * Fetch data from Google Sheets using OAuth credentials
 * This function should be called from a server-side API route
 */
export async function fetchGoogleSheetsData(
  accessToken: string
): Promise<GoogleSheetsData> {
  // Create OAuth2 client with access token
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Fetch all three tabs in parallel
    const [transferOrdersResponse, transferOrderLinesResponse, skuAttributesResponse] =
      await Promise.all([
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'transferOrders!A:F',
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'transferOrderLines!A:D',
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'skuAttributes!A:F',
        }),
      ]);

    // Parse transfer orders
    const transferOrdersRows = transferOrdersResponse.data.values || [];
    const transferOrdersHeaders = transferOrdersRows[0] || [];
    const transferOrders: GoogleSheetTransferOrder[] = transferOrdersRows
      .slice(1)
      .filter((row) => row[0]) // Filter out empty rows
      .map((row) => ({
        Transfer: row[0] || '',
        Merchant: row[1] || '',
        Status: row[2] || '',
        'Estimated Arrival': row[3] || '',
        'Receipt Time': row[4] || '',
        Destination: row[5] || '',
      }));

    // Parse transfer order lines
    const transferOrderLinesRows = transferOrderLinesResponse.data.values || [];
    const transferOrderLines: GoogleSheetTransferOrderLine[] = transferOrderLinesRows
      .slice(1)
      .filter((row) => row[0]) // Filter out empty rows
      .map((row) => ({
        Transfer: row[0] || '',
        SKU: row[1] || '',
        'Units Incoming': parseFloat(row[2]) || 0,
        'Units Received': parseFloat(row[3]) || 0,
      }));

    // Parse SKU attributes
    const skuAttributesRows = skuAttributesResponse.data.values || [];
    const skuAttributes: GoogleSheetSkuAttribute[] = skuAttributesRows
      .slice(1)
      .filter((row) => row[0]) // Filter out empty rows
      .map((row) => ({
        SKU: row[0] || '',
        Description: row[1] || '',
        Barcode: row[2] || '',
        'Daily Units Sold': parseFloat(row[3]) || 0,
        'Units on Hand - Pick Face': parseFloat(row[4]) || 0,
        'Units on Hand - Reserve': parseFloat(row[5]) || 0,
      }));

    return {
      transferOrders,
      transferOrderLines,
      skuAttributes,
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw new Error('Failed to fetch data from Google Sheets');
  }
}

/**
 * Get Google OAuth URL for authentication
 */
export function getGoogleAuthUrl(redirectUri: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getGoogleTokens(code: string, redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

