# Complaint Management System

A professional complaint management system built with Next.js 14, TypeScript, and MongoDB. Streamline your customer service operations with role-based access control and automated workflows.

## Features

- **Role-Based Access Control**: Admin, Manager, Employee, and Client roles
- **Complaint Workflow**: New → Assigned → In Progress → Completed → Done → Closed
- **File Attachments**: Support for evidence and documentation
- **Real-Time Notifications**: Email, WhatsApp, and system notifications
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Themes**: User preference support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod validation

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm/yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd complaint-management-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI="mongodb://localhost:27017/complaint-management"

# Authentication
NEXTAUTH_SECRET="your-super-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Admin User (Optional - for automated setup)
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="your-secure-password"
ADMIN_NAME="System Administrator"

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="complaint-files"

# Email (Optional)
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@yourcompany.com"

# WhatsApp API (WAAPI) - Optional
WAAPI_INSTANCE_ID="your-waapi-instance-id"
WAAPI_API_KEY="your-waapi-api-key"
WAAPI_BASE_URL="https://waapi.app/api/v1"
```

### Database Setup

```bash
# Initialize production database with admin user
node scripts/init-production.js
```

### Development Server

```bash
npm run dev
# Visit http://localhost:3000
```

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment, especially:

- `NEXTAUTH_SECRET`: Use a strong, randomly generated secret
- `MONGODB_URI`: Your production MongoDB connection string
- `NEXTAUTH_URL`: Your production domain URL

### Database Initialization

Run the production initialization script on your production server:

```bash
node scripts/init-production.js
```

This will create the initial admin user. Make sure to:
1. Change the default password after first login
2. Set up your departments and users through the admin interface
3. Configure system settings as needed

## Usage Guide

### For Admins

1. **User Management**: Create and manage user accounts
2. **Department Setup**: Configure departments and managers
3. **System Settings**: Configure notifications and system preferences
4. **Monitoring**: View system-wide statistics and reports

### For Managers

1. **Team Oversight**: Monitor department complaints and team performance
2. **Assignment**: Assign complaints within your department
3. **Approval**: Review and approve completed work
4. **Reporting**: Access department-specific analytics

### For Employees

1. **Work Queue**: View and manage assigned complaints
2. **Status Updates**: Update complaint status and add notes
3. **Communication**: Respond to client queries
4. **Documentation**: Upload solutions and attachments

### For Clients

1. **Submit Complaints**: Create new complaints with attachments
2. **Track Progress**: Monitor status updates in real-time
3. **Communication**: Add comments and additional information
4. **History**: View complete complaint history

## Security Features

- JWT-based authentication with NextAuth.js
- Role-based access control (RBAC)
- Input validation with Zod schemas
- SQL injection protection via Mongoose ODM
- XSS protection through React's built-in sanitization
- CSRF protection via NextAuth.js

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard & management
│   ├── api/                # Backend API routes
│   ├── client/             # Client interface
│   ├── employee/           # Employee workspace
│   ├── manager/            # Manager tools
│   └── login/              # Authentication
├── components/             # Reusable UI components
├── lib/                    # Utilities & configurations
├── models/                 # MongoDB/Mongoose schemas
├── types/                  # TypeScript definitions
└── middleware.ts           # Route protection
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the documentation
- Review existing issues
- Contact your system administrator

---

**Built with ❤️ for efficient complaint management**
