# Complaint Management System 🎯

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)

A comprehensive, enterprise-grade complaint management system built with Next.js 14, TypeScript, and MongoDB. Streamline your customer service operations with role-based access control, automated workflows, and real-time notifications.

## ✨ Features

### 🔐 Role-Based Access Control
- **Admin**: Complete system management, user creation, global oversight
- **Manager**: Department oversight, cross-team assignment, approval workflows  
- **Employee**: Complaint handling, status updates, escalation capabilities
- **Client**: Complaint submission, real-time tracking, communication

### 📋 Advanced Complaint Management
- **Smart Workflow**: Structured progression (New → Assigned → In Progress → Completed → Done → Closed)
- **Cross-Department Routing**: Intelligent assignment based on expertise
- **File Attachments**: Support for evidence, screenshots, and documents
- **Audit Trail**: Complete history tracking with timestamps and user actions
- **Bulk Operations**: Handle multiple complaints efficiently

### 🔔 Real-Time Notifications
- **Email Integration**: Automated updates via SendGrid
- **WhatsApp Alerts**: Instant notifications through waapi.app
- **In-App Notifications**: Real-time dashboard updates
- **Custom Templates**: Personalized messaging for different user roles

### 🎨 Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Themes**: User preference support
- **Advanced Search**: Filter by status, department, date range, assignee
- **Export Capabilities**: Generate reports in multiple formats
- **Dashboard Analytics**: Visual insights and KPI tracking

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Custom hooks
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes (serverless)
- **Authentication**: NextAuth.js with JWT
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: AWS S3 (configurable)
- **Email**: SendGrid integration
- **WhatsApp**: waapi.app integration

### Development Tools
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Build**: Next.js optimized builds
- **Deployment**: Vercel-ready configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm/yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/complaint-management-system.git
cd complaint-management-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Configuration

```env
# Database
MONGODB_URI="mongodb://localhost:27017/complaint-management"

# Authentication (Generate a secure secret)
NEXTAUTH_SECRET="your-super-secure-secret-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"  
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="complaint-files"

# WhatsApp Integration (Optional)
WAAPI_APP_API_KEY="your-waapi-key"

# Email Integration (Optional)
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@yourcompany.com"
```

### Database Setup

```bash
# Initialize database with sample data
npm run db:seed

# Or manually create admin user
npm run create:admin
```

### Development Server

```bash
npm run dev
# Visit http://localhost:3000
```

## 👤 Default Credentials

**⚠️ Change these immediately after first login!**

```
Admin:    admin@company.com    / admin123
Manager:  manager@company.com  / manager123  
Employee: employee@company.com / employee123
Client:   client@company.com   / client123
```

## 📖 Usage Guide

### For Clients 👥
1. **Submit Complaints**: Detailed forms with file attachments
2. **Track Progress**: Real-time status updates and notifications
3. **Communication**: Direct messaging with assigned staff
4. **History**: Complete audit trail of all interactions

### For Employees 👷
1. **Dashboard**: View assigned complaints and workload
2. **Processing**: Update status, add notes, upload solutions
3. **Escalation**: Transfer to other departments when needed
4. **Communication**: Respond to client queries directly

### For Managers 🎯
1. **Oversight**: Monitor team performance and SLA compliance
2. **Assignment**: Distribute workload and handle escalations  
3. **Approval**: Review completed work before client notification
4. **Analytics**: Access reports and performance metrics

### For Admins ⚙️
1. **User Management**: Create/modify accounts and permissions
2. **System Configuration**: Department setup, notification templates
3. **Monitoring**: System health, usage analytics, audit logs
4. **Maintenance**: Data cleanup, backup management

## 🏗️ Project Structure

```
complaint-management-system/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router pages
│   │   ├── 📁 admin/              # Admin dashboard & management
│   │   ├── 📁 api/                # Backend API routes
│   │   ├── 📁 client/             # Client-facing interface
│   │   ├── 📁 employee/           # Employee workspace
│   │   ├── 📁 manager/            # Manager oversight tools
│   │   └── 📁 login/              # Authentication pages
│   ├── 📁 components/             # Reusable UI components
│   │   ├── 📁 ui/                 # shadcn/ui base components
│   │   ├── 📁 forms/              # Form components
│   │   ├── 📁 layout/             # Layout components
│   │   └── 📁 providers/          # Context providers
│   ├── 📁 lib/                    # Utilities & configurations
│   ├── 📁 models/                 # MongoDB/Mongoose schemas
│   ├── 📁 types/                  # TypeScript type definitions
│   └── 📁 middleware.ts           # Route protection
├── 📁 public/                     # Static assets
├── 📁 scripts/                    # Database scripts
├── 📄 package.json
├── 📄 tailwind.config.js
├── 📄 tsconfig.json
└── 📄 next.config.js
```

## 🔌 API Reference

### Authentication Endpoints
```http
POST /api/auth/signin      # User login
POST /api/auth/signout     # User logout
```

### User Management
```http
GET    /api/users              # List users (Admin)
POST   /api/users              # Create user (Admin)
PUT    /api/users/[id]         # Update user (Admin)
DELETE /api/users/[id]         # Deactivate user (Admin)
```

### Complaint Operations
```http
GET    /api/complaints         # List complaints (role-filtered)
POST   /api/complaints         # Create complaint
GET    /api/complaints/[id]    # Get complaint details
PUT    /api/complaints/[id]    # Update complaint
POST   /api/complaints/[id]/assign  # Reassign complaint
GET    /api/complaints/[id]/history # Get complaint history
```

### Department Management
```http
GET    /api/departments        # List departments
POST   /api/departments        # Create department (Admin)
PUT    /api/departments/[id]   # Update department (Admin)
DELETE /api/departments/[id]   # Deactivate department (Admin)
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🏭 Production Deployment

### Build Process
```bash
# Create production build
npm run build

# Start production server
npm start

# Check build locally
npm run build && npm start
```

### Deployment Platforms

#### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables in dashboard
3. Deploy automatically on push

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build settings (Node.js 18+)
3. Add environment variables
4. Deploy

#### Docker Deployment
```dockerfile
# Use the included Dockerfile
docker build -t complaint-management .
docker run -p 3000:3000 --env-file .env.local complaint-management
```

## 🔒 Security Best Practices

### Implementation Status
- ✅ **Authentication**: Secure JWT-based auth with NextAuth.js
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **Input Validation**: Zod schemas for all form inputs
- ✅ **SQL Injection Protection**: Mongoose ODM prevents injection
- ✅ **XSS Protection**: React's built-in XSS prevention
- ✅ **CSRF Protection**: NextAuth.js CSRF tokens
- ✅ **Rate Limiting**: API route protection (configurable)

### Production Checklist
- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure MongoDB authentication
- [ ] Set up proper firewall rules
- [ ] Enable audit logging
- [ ] Implement backup strategy
- [ ] Configure monitoring alerts
- [ ] Review and update dependencies

## 📊 Performance Optimizations

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Aggressive caching for static assets
- **Database Indexing**: Optimized MongoDB indexes
- **Lazy Loading**: Components loaded on demand
- **Bundle Analysis**: Built-in bundle analyzer

```bash
# Analyze bundle size
npm run analyze

# Performance testing
npm run lighthouse
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Code Standards
- Use TypeScript for all new code
- Follow the existing code style (Prettier/ESLint)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 Changelog

### v1.0.0 (Latest)
- ✨ Initial release with full complaint management functionality
- 🔐 Complete role-based access control system
- 📧 Email and WhatsApp notification integration
- 📱 Responsive design for all device types
- 🎨 Dark/light theme support
- 📊 Analytics dashboard with KPI tracking

### Planned Features (v1.1.0)
- 📈 Advanced reporting and analytics
- 🌐 Multi-language support (i18n)
- 📱 Native mobile app (React Native)
- 🔌 REST API documentation (OpenAPI/Swagger)
- 📊 Real-time dashboard updates (WebSocket)
- 🤖 AI-powered complaint categorization

## 📞 Support

### Documentation
- [User Guide](docs/USER_GUIDE.md)
- [Admin Manual](docs/ADMIN_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

### Community
- 🐛 [Report Issues](https://github.com/yourusername/complaint-management-system/issues)
- 💡 [Feature Requests](https://github.com/yourusername/complaint-management-system/discussions)
- 📧 Email: support@yourcompany.com
- 💬 Discord: [Join our community](https://discord.gg/yourserver)

### Professional Support
Enterprise support packages available with:
- Priority bug fixes and feature requests
- Custom development and integrations
- Dedicated support channels
- SLA guarantees

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [MongoDB](https://www.mongodb.com/) - Document database
- [NextAuth.js](https://next-auth.js.org/) - Authentication library

---

<div align="center">

**⭐ Star this repository if it helped you!**

[🚀 Live Demo](https://complaint-management-demo.vercel.app) • [📖 Documentation](docs/) • [💬 Discord](https://discord.gg/yourserver)

**Built with ❤️ by [Your Company Name]**

</div>

---

> **⚠️ Important**: This system handles sensitive customer data. Ensure you comply with relevant data protection regulations (GDPR, CCPA, etc.) in your jurisdiction.