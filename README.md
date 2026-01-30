# TaxiTrack

A modern taxidermy shop management system built with Next.js and Google Sheets.

## Features

- 📋 **Customer Management** - Track customers with contact info and notes
- 📝 **Estimates & Invoices** - Create estimates, convert to invoices with one click
- 🦌 **Project Tracking** - 7 status stages from Received → Picked Up
- 💰 **Payment Recording** - Track deposits and payments, auto-update balances
- 🏷️ **Price Book** - Manage your service catalog
- 📦 **Batch Tannery Sends** - Select multiple projects, send to tannery together
- 📊 **Dashboard** - Active projects, ready for pickup, outstanding balances
- 🔄 **Google Sheets Backend** - All data syncs to your own Google Sheet

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Google Apps Script
- **Database**: Google Sheets

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/galengrimm-code/TaxiTrack.git
cd TaxiTrack
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Connect to Google Sheets

1. **Create a new blank Google Sheet**

2. **Add the Apps Script:**
   - Go to Extensions → Apps Script
   - Delete any existing code
   - Copy/paste the code from `apps-script/Code.gs`
   - Click Save

3. **Deploy as Web App:**
   - Click Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy
   - Copy the URL

4. **Connect in Settings:**
   - Open TaxiTrack → Settings
   - Paste the URL
   - Click "Test Connection"
   - Click "Setup Database" (creates all tabs automatically)

## Deployment to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/galengrimm-code/TaxiTrack)

### Option 2: Manual Deploy

```bash
npm install -g vercel
vercel
```

### Environment Variables (Optional)

Set in Vercel dashboard or `.env.local`:

```env
NEXT_PUBLIC_SHEETS_API_URL=https://script.google.com/macros/s/xxxxx/exec
```

## Project Structure

```
TaxiTrack/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── customers/         # Customer management
│   │   ├── estimates/         # Estimate management
│   │   ├── invoices/          # Invoice management
│   │   ├── projects/          # Project tracking
│   │   ├── pricebook/         # Service catalog
│   │   ├── reports/           # Business reports
│   │   └── settings/          # App configuration
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── layout/            # Layout components
│   └── lib/
│       ├── api.ts             # Google Sheets API client
│       ├── types.ts           # TypeScript definitions
│       ├── utils.ts           # Utility functions
│       └── DataContext.tsx    # Global state management
├── apps-script/
│   └── Code.gs                # Google Apps Script backend
└── public/                     # Static assets
```

## Google Sheets Structure

The app automatically creates these tabs:

| Tab | Purpose |
|-----|---------|
| Customers | Customer contact info |
| Services | Price book items |
| Estimates | Estimate headers |
| EstimateLineItems | Estimate line items |
| Invoices | Invoice headers |
| InvoiceLineItems | Invoice line items |
| Payments | Payment records |
| Projects | Individual mount tracking |
| Settings | Business configuration |

## Future Integrations

The Next.js structure supports easy integration with:

- **Twilio** - SMS notifications for ready pickups
- **Stripe** - Online payment processing
- **Resend/SendGrid** - Email invoices
- **Supabase** - Alternative database if you outgrow Sheets
- **NextAuth** - Customer portal authentication

## Contributing

Pull requests welcome! Please open an issue first to discuss changes.

## License

MIT License - Use freely for your taxidermy business!
