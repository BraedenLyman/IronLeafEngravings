<div align="center">

# IronLeaf Engravings

</div>

<br />
<br />

<div align="center">
  A custom engraving storefront for turning photos and designs into engraved keepsakes. Built with a polished
  shopping flow, product customization, and an admin order dashboard to keep fulfillment fast and accurate.
</div>

<br />
<br />

<div align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,firebase,nodejs" />
</div>

<br />
<br />

## Demo

Live Site: https://iron-leaf.ca

## Features

- Responsive storefront with product listings and detail pages
- Product customization with image upload and live cart updates
- Cart + checkout flow powered by Stripe
- Order confirmation + receipt emails
- Contact form with SMTP delivery
- Admin orders dashboard with status updates and asset downloads
- Policies pages (privacy, terms, returns) and a guided “How it works” flow

## Tech Stack

```json
{
  "frontend": ["Next.js 16", "React 19", "TypeScript", "CSS Modules", "Tailwind CSS 4"],
  "ui": ["Ant Design", "React Icons"],
  "commerce": ["Stripe Checkout"],
  "backend": ["Next.js App Router", "Firebase Hosting"],
  "data": ["Firebase Firestore", "Firebase Storage", "Firebase Auth", "Firebase Admin SDK"],
  "email": ["Nodemailer (SMTP)"]
}
```

## Installation

> Node.js LTS recommended

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file in the project root and set the following variables:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase admin
FIREBASE_SERVICE_ACCOUNT_JSON=

# or use a service account file path
GOOGLE_APPLICATION_CREDENTIALS=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (contact + receipts)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

## Scripts

- `npm run dev` - Start Next.js dev server

## Usage

IronLeaf Engravings is built to support the full purchase flow for custom engraving orders:

- Browse products and customize with an uploaded image
- Add items to the cart and complete Stripe checkout
- Receive confirmation + receipt emails
- Manage orders from the admin dashboard

## Author

Braeden Lyman
