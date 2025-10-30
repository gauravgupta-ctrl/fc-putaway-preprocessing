# Project Setup Guide

## Prerequisites

### 1. Install Node.js
You need Node.js to run this project. Please install it first:

**For macOS:**
- Visit: https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer and follow the prompts
- Verify installation by running: `node --version` in Terminal

---

## Third-Party Services Setup

### 2. Create Supabase Account

1. **Sign up:**
   - Visit: https://supabase.com/
   - Click "Sign up" and create a free account

2. **Create a new project:**
   - Click "New Project"
   - Name it: "Putaway Preprocess"
   - Choose a strong database password (save this!)
   - Select a region close to you
   - Click "Create new project"
   - Wait ~2 minutes for setup

3. **Get your credentials:**
   - Go to the "API Docs" section (or Project Settings > API)
   - On the "Connect To Your Project" page, you'll see your credentials
   - Copy:
     - **Project URL** (shown in the code snippet, looks like: https://ascuejemeuxubjbdskvl.supabase.co)
     - **anon/public key** (in the API settings, long string starting with "eyJ...")

4. **Save these values** - you'll need them next!

---

### 3. Create Resend Account

1. **Sign up:**
   - Visit: https://resend.com/
   - Click "Sign up" and create a free account

2. **Verify your email:**
   - Check your email and verify your account

3. **Get your API key:**
   - Click "API Keys" in the sidebar
   - Click "Create API Key"
   - Name it: "Putaway App"
   - Click "Add"
   - **Copy the API key immediately** (you can only see it once!)

4. **Verify sender domain (later):**
   - We'll set this up after basic setup is done
   - For testing, you can use Resend's test email

---

## After Node.js is Installed

Run these commands in Terminal:

```bash
# Navigate to project directory
cd "/Users/gaurav.gupta/Documents/Cursor Projects/Putaway Preprocess"

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Supabase and Resend credentials
# (See instructions in .env.example file)
```

---

## Next Steps

Once you have:
- ✅ Node.js installed
- ✅ Supabase account created
- ✅ Resend account created
- ✅ Credentials copied

Come back and we'll continue with the actual project setup!

