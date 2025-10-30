# Putaway Preprocess

A production-quality application for managing putaway processes in fulfillment centers.

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + API)
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## Setup Instructions

Please follow the detailed setup instructions in [SETUP.md](./SETUP.md).

### Quick Start (after prerequisites are met)

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials

# Run development server
npm run dev
```

Visit http://localhost:3000 to see your app!

## Deployment

Ready to deploy? Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Recommended:** Deploy to Vercel for the easiest setup.

## Project Structure

```
/app              - Next.js app directory (pages and layouts)
/lib              - Utility functions and client configs
/public           - Static assets
/components       - Reusable React components (to be created)
/types            - TypeScript type definitions (to be created)
```

## Features (To Be Implemented)

- User authentication and authorization
- Putaway process workflow management
- Inventory tracking
- Task management
- Real-time updates
- Email notifications
- Barcode scanning
- Reporting and analytics

## License

Private - Internal Use Only

