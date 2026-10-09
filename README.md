# BillSprout Smart ERP - Fast Billing System by LifeSprouts Care

A comprehensive, full-stack BillSprout Smart ERP system built with React, Vite, and Supabase. This is a production-ready application that handles all aspects of pharmacy management including inventory, sales, purchases, customer management, and reporting.

## 🚀 Features

### Core Functionality
- **Role-based Authentication** - Admin, Pharmacist, Staff, Patient, Retailer, Wholesaler roles
- **Point of Sale (POS)** - Professional billing system with barcode support
- **Medicine Management** - Complete CRUD with batch-wise inventory tracking
- **Inventory Management** - FEFO logic, expiry tracking, low stock alerts
- **Purchase Management** - Supplier orders with automatic inventory updates
- **Sales Management** - Retail and wholesale billing with GST compliance
- **Customer/Patient Management** - Complete customer database with history
- **Retailer & Wholesaler Management** - B2B customer management
- **Payment Management** - Multiple payment methods, credit tracking
- **Returns Processing** - Complete return workflow with stock restoration
- **Reports & Analytics** - Comprehensive business reports
- **User Management** - Role-based access control
- **Settings & Configuration** - Pharmacy settings, tax configuration

### Technical Features
- **Real-time Updates** - Live inventory and sales data
- **FEFO Inventory Logic** - First Expiry, First Out automatic selection
- **GST Compliance** - CGST/SGST/IGST calculations based on state
- **Batch Tracking** - Complete medicine batch lifecycle management
- **Audit Logging** - Track all critical operations
- **Row Level Security** - Database-level access control
- **Responsive Design** - Desktop-first with mobile compatibility
- **Professional UI/UX** - Clean, medical-themed interface

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **Zustand** - State management
- **Recharts** - Charts and analytics
- **Lucide React** - Modern icon library
- **jsPDF** - PDF generation for invoices
- **React Hot Toast** - Toast notifications

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security
- **Supabase Auth** - Authentication and authorization
- **Supabase Storage** - File storage
- **Edge Functions** - Server-side logic where needed

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Modern web browser

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pharmacy-erp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Setup Database

1. In your Supabase dashboard, go to the SQL Editor
2. Run the `supabase-schema.sql` file to create all tables and functions
3. Optionally, run `seed-data.sql` to populate with sample data (development only)

### 5. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your authentication settings as needed
3. Create initial admin user through the Auth interface
4. Update the profiles table with the admin user's information

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔐 User Roles & Access

### Admin
- Full system access
- User management
- System settings
- All modules and reports

### Pharmacist
- Medicine management
- Inventory control
- POS operations
- Customer management
- Reports

### Staff
- POS operations
- Basic customer management
- Sales history

### Patient
- View own profile
- Purchase history
- Prescription management

### Retailer/Wholesaler
- Own account management
- Order history
- Payment tracking

## 📊 Key Modules

### 1. Point of Sale (POS)
- Search medicines by name, generic name, or barcode
- Real-time stock checking
- Batch selection with FEFO logic
- Support for free quantities and schemes
- Multiple payment methods
- Instant invoice generation
- Customer selection (optional)
- Wholesale vs retail pricing

### 2. Medicine Management
- Complete medicine database
- Batch-wise inventory tracking
- Expiry date management
- Low stock alerts
- Pricing management (MRP, selling price, wholesale price)
- GST configuration per medicine
- Prescription requirements tracking

### 3. Inventory Management
- Real-time stock levels
- Batch tracking with FEFO logic
- Expiry alerts (30, 60, 90 days)
- Low stock notifications
- Stock movements tracking
- Automatic stock updates from sales/purchases
- Stock adjustment capabilities

### 4. Purchase Management
- Create purchase orders
- Supplier management
- Automatic inventory updates
- Batch creation during purchase
- Free quantity handling
- GST calculations
- Payment tracking

### 5. Sales Management
- Complete sales history
- Invoice management
- Payment status tracking
- Customer purchase history
- Sales analytics
- Return processing

### 6. Customer Management
- Patient/customer database
- Purchase history tracking
- Outstanding balance management
- Prescription history
- Emergency contacts

### 7. Reports & Analytics
- Sales reports (daily, monthly, custom periods)
- Purchase reports
- Profit analysis
- GST reports
- Stock reports
- Expiry reports
- Customer reports

## 🏗 Database Schema

The system uses a robust PostgreSQL database with the following key tables:

- **profiles** - User information linked to Supabase Auth
- **medicines** - Medicine master data
- **medicine_batches** - Batch-wise inventory
- **customers** - Customer/patient information
- **retailers/wholesalers** - B2B customer data
- **sales/sale_items** - Sales transactions
- **purchases/purchase_items** - Purchase orders
- **stock_movements** - All inventory movements
- **payments** - Payment tracking
- **returns** - Return processing
- **audit_logs** - System audit trail

## 🔒 Security Features

### Row Level Security (RLS)
- Database-level access control
- Users can only access authorized data
- Role-based data filtering

### Authentication
- Secure Supabase Auth integration
- Session management
- Password policies
- Email verification

### Data Protection
- No sensitive data in frontend code
- Secure API key usage
- Audit logging for critical operations
- Input validation and sanitization

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables

### Other Hosting Platforms

The built files in the `dist` folder can be served by any static hosting service.

## 🧪 Testing the Application

### Demo Accounts (if using seed data)

After setting up with seed data, you can create these test accounts:

- **Admin**: `admin@pharmacy.com` / `admin123`
- **Pharmacist**: `pharmacist@pharmacy.com` / `pharma123`
- **Staff**: `staff@pharmacy.com` / `staff123`

### Core Workflow Testing

1. **Login** as admin
2. **Add medicines** with batches
3. **Create customers** (optional for walk-in sales)
4. **Process sales** through POS
5. **Verify inventory** updates automatically
6. **Create returns** and verify stock restoration
7. **Check reports** for sales data
8. **Test expiry alerts** and low stock notifications

## 🔧 Configuration

### Environment Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Pharmacy Settings

Configure through the Settings page in the admin panel:
- Pharmacy information
- Tax settings (GSTIN, state, rates)
- Invoice settings
- Low stock thresholds
- Expiry alert periods

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Review the code comments
3. Test with the provided seed data
4. Create an issue for bugs or feature requests

## 🔮 Roadmap

Future enhancements planned:
- Mobile app (React Native)
- Advanced analytics
- Integration with external systems
- Multi-location support
- Advanced reporting
- Barcode generation
- WhatsApp integration for notifications
- Advanced prescription management

---

**Note**: This is a production-ready application. Ensure proper testing and backup procedures before deploying to production environments.