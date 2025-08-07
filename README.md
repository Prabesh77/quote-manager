# Quote Management System

A comprehensive quote management system built with Next.js, TypeScript, Tailwind CSS, and Supabase. The system focuses on quote creation, order tracking, and delivery management with a modern, responsive interface.

## 🏗️ Project Structure

### Quote Management (`/quotes/*`) - **Primary Focus**
- **Add Quote** (`/quotes/new`) - Create new quotes with vehicle and part details
- **Pricing** (`/quotes/pricing`) - Manage quote pricing
- **Orders** (`/quotes/orders`) - Track order status and delivery
- **Dashboard** (`/quotes/dashboard`) - Business statistics and analytics
- **Delivery Management** (`/quotes/delivery`) - Integrated delivery tracking

### Delivery App (`/delivery/*`) - **On Hold**
- **Admin Dashboard** (`/delivery/admin`) - Comprehensive dashboard for administrators
- **Driver App** (`/delivery/driver`) - Mobile-first interface for delivery drivers
- **Authentication** (`/delivery/auth`) - Login and user management

## 🚀 Features

### Quote Management System - **Primary Focus**
- **Quote Creation**: Multi-part quotes with vehicle and customer details
- **Pricing Management**: Dynamic pricing with part selection
- **Order Tracking**: Complete lifecycle from quote to delivery
- **Customer Management**: Auto-fill customer information
- **Business Analytics**: Dashboard with statistics and metrics
- **Delivery Integration**: Photo proof and digital signatures

### Delivery System - **On Hold**
- **Authentication**: Role-based access (Admin/Driver)
- **Admin Features**:
  - Add new deliveries with customer auto-fill
  - Dashboard with delivery statistics
  - Search and filter deliveries
  - Overdue delivery alerts (24hrs)
  - Real-time status tracking
- **Driver Features**:
  - Mobile-first interface
  - Search and filter available deliveries
  - Bulk assign deliveries to driver
  - Mark deliveries as completed with photo proof
  - Digital signature capture
  - Invoice number verification

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Hooks, Context API
- **Authentication**: Supabase Auth with Row Level Security

## 📊 Database Schema

### Core Tables
- `user_profiles` - User authentication and roles
- `customers` - Customer information with account numbers
- `deliveries` - Delivery records with status tracking
- `driver_deliveries` - Driver assignment tracking

### Legacy Tables
- `quotes` - Quote management
- `parts` - Part catalog
- `deliveries` (legacy) - Previous delivery system

## 🔐 Security

- Row Level Security (RLS) policies
- Role-based access control
- Secure file uploads to Supabase Storage
- Input validation and sanitization

## 📱 Mobile-First Design

The driver app is designed with a mobile-first approach:
- Touch-friendly interface
- Optimized for small screens
- Offline-capable features
- Camera integration for photo proof
- Signature capture with canvas

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd delivery-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a Supabase project
   - Run the SQL scripts in `src/supabase_delivery_tables.sql`
   - Configure environment variables

4. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📁 File Structure

```
src/
├── app/
│   ├── delivery/           # New delivery-centric app
│   │   ├── admin/         # Admin dashboard
│   │   ├── driver/        # Driver mobile app
│   │   └── auth/          # Authentication
│   ├── quotes/            # Legacy quote management
│   │   ├── new/          # Add quotes
│   │   ├── pricing/      # Quote pricing
│   │   ├── orders/       # Order management
│   │   ├── dashboard/    # Business analytics
│   │   └── delivery/     # Legacy delivery
│   └── page.tsx          # Landing page
├── components/
│   ├── auth/             # Authentication components
│   ├── ui/               # Reusable UI components
│   └── delivery/         # Delivery-specific components
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🔄 Migration from Quote System

The original quote management system has been preserved in `/quotes/*` routes:
- All existing functionality remains intact
- Database tables and relationships preserved
- UI components and styling maintained
- Can be accessed via the landing page link

## 📈 Future Enhancements

- Real-time notifications
- GPS tracking integration
- Route optimization
- Advanced analytics
- Multi-language support
- Offline mode improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
