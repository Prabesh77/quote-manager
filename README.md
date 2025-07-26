# 🚗 Auto Parts Quote Management System

A modern, fast, and efficient quote management system designed for busy automotive parts businesses. Built with Next.js, TypeScript, and Supabase for seamless real-time operations.

## ✨ Features

### 📋 **Quote Management**
- **Fast Quote Creation** - Paste raw text or fill forms manually
- **Real-time Updates** - Instant synchronization across all users
- **Smart Auto-fill** - Parse structured text into form fields
- **Part Selection** - Visual part selection with relevant icons
- **Status Tracking** - Track quotes from creation to completion

### 🎯 **Workflow Management**
- **Active Quotes** - Manage ongoing quotes with pricing
- **Completed Quotes** - Archive finished quotes for reference
- **Status Filtering** - Filter by Unpriced, Priced, or Completed
- **Bulk Operations** - Edit multiple parts simultaneously

### 💼 **Advanced Features**
- **Inline Editing** - Edit quotes and parts directly in the table
- **Copy to Clipboard** - One-click copy for VIN, part numbers, and references
- **Keyboard Shortcuts** - Ctrl+F for search, Enter to save, Esc to cancel
- **Responsive Design** - Works perfectly on desktop and mobile
- **Connection Health** - Real-time database connection monitoring

### 🎨 **User Experience**
- **Smooth Animations** - Subtle transitions and accordion effects
- **Visual Feedback** - Loading states and confirmation dialogs
- **Intuitive Interface** - Clean, modern design with clear visual hierarchy
- **Accessibility** - Proper ARIA labels and keyboard navigation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auto-parts-quote-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   ```sql
   -- Create quotes table
   CREATE TABLE quotes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     quoteRef TEXT NOT NULL,
     vin TEXT,
     make TEXT,
     model TEXT,
     series TEXT,
     auto BOOLEAN DEFAULT false,
     body TEXT,
     mthyr TEXT,
     rego TEXT,
     partRequested TEXT,
     createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     status TEXT DEFAULT 'active'
   );

   -- Create parts table
   CREATE TABLE parts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     number TEXT,
     price DECIMAL(10,2),
     note TEXT,
     quoteId UUID REFERENCES quotes(id) ON DELETE CASCADE
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Creating Quotes

1. **Navigate to the main page** (`/new`)
2. **Choose your input method:**
   - **Paste raw text** and click "Auto-Fill" to parse structured data
   - **Fill the form manually** with vehicle and quote details
3. **Select required parts** from the visual part selector
4. **Click "Create Quote"** to save

### Managing Quotes

#### Active Quotes Page (`/new`)
- **View all active quotes** in a sortable table
- **Filter by status** (All, Unpriced, Priced)
- **Search quotes** by reference, VIN, or make
- **Expand rows** to view and edit parts
- **Inline editing** for quick updates
- **Mark as completed** when finished

#### Completed Quotes Page (`/completed-quotes`)
- **View archived quotes** sorted by latest first
- **Read-only interface** for reference
- **Copy functionality** for sharing details

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + F` | Focus search bar |
| `Enter` | Save current edits |
| `Esc` | Cancel current edits |

### Part Management

- **Visual part selection** with relevant icons
- **Bulk part editing** for efficient updates
- **Price and note fields** for detailed tracking
- **Copy part numbers** with one click

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form management

### Backend
- **Supabase** - Real-time database and authentication
- **PostgreSQL** - Reliable data storage
- **Row Level Security** - Secure data access

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── new/               # Main quote management page
│   ├── completed-quotes/  # Completed quotes archive
│   └── layout.tsx         # Root layout
├── components/
│   └── ui/               # Reusable UI components
│       ├── QuoteForm.tsx     # Quote creation form
│       ├── QuoteTable.tsx    # Quotes display table
│       ├── ConnectionStatus.tsx # Health monitoring
│       └── useQuotes.ts       # Data management hooks
├── lib/
│   └── utils.ts          # Utility functions
└── utils/
    └── supabase.ts       # Supabase client configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

### Database Schema

The system uses two main tables:

**quotes** - Stores quote information
- `id` - Unique identifier
- `quoteRef` - Quote reference number
- `vin` - Vehicle identification number
- `make`, `model`, `series` - Vehicle details
- `auto` - Transmission type
- `body`, `mthyr`, `rego` - Additional vehicle info
- `partRequested` - Comma-separated part IDs
- `createdAt` - Creation timestamp
- `status` - Quote status (active/completed)

**parts** - Stores part information
- `id` - Unique identifier
- `name` - Part name
- `number` - Part number
- `price` - Part price
- `note` - Additional notes
- `quoteId` - Reference to quote

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information

## 🙏 Acknowledgments

- **Supabase** for the excellent real-time database
- **Next.js team** for the amazing framework
- **Tailwind CSS** for the utility-first styling
- **Lucide** for the beautiful icons

---

**Built with ❤️ for automotive parts businesses**
