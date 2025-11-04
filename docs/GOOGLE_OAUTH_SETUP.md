# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for Google Sheets API access.

## Prerequisites

- Google account
- Access to Google Cloud Console

## Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it: "Putaway Preprocess"
4. Click "Create"

### 2. Enable Google Sheets API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen first:
   - User Type: Internal (if using Google Workspace) or External
   - App name: "Putaway Preprocess"
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - Search for "Google Sheets API"
     - Select: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Click "Save and Continue"
   - Test users: Add your email
   - Click "Save and Continue"

4. Back to creating OAuth client ID:
   - Application type: "Web application"
   - Name: "Putaway Preprocess Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.vercel.app` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
   - Click "Create"

5. Copy the **Client ID** and **Client Secret**

### 4. Add Credentials to Environment Variables

Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### 5. Grant Access to Spreadsheet

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1wCPtQV6hQxZtKn-yRkncLnLnJdN5zU3mcRSfHNiHuH0/edit
2. The OAuth flow will request access when you first sync data
3. Grant the application access to read your Google Sheets

## Testing

1. Start the development server: `npm run dev`
2. Navigate to Settings page
3. Click "Refresh Data from Google Sheets"
4. You'll be prompted to authenticate
5. After authentication, data will sync automatically

## Production Deployment

When deploying to Vercel:

1. Add environment variables in Vercel dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

2. Update authorized redirect URIs in Google Cloud Console:
   - Add your production domain

## Troubleshooting

**Error: redirect_uri_mismatch**
- Ensure the redirect URI in your code matches exactly what's configured in Google Cloud Console

**Error: access_denied**
- Check OAuth consent screen configuration
- Ensure you've added your email as a test user (if using External user type)

**Error: invalid_grant**
- Refresh token may have expired
- Re-authenticate through the app

## Security Notes

- Never commit `.env.local` to Git
- Keep your Client Secret secure
- Use different credentials for development and production
- Regularly review and rotate credentials
- Limit scopes to only what's needed (read-only access)

## References

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

