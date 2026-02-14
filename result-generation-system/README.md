# Result Generation System (RGS)

A complete web-based examination and midterm result generation system for Nigerian schools.

![Result Generation System](public/images/Result_Generation_System.jpg)

## 🎓 Features

### For Administrators
- **User Management**: Create and manage teacher and parent accounts
- **Authorization System**: Generate secure 6-digit codes for registration
- **Class Management**: Create and assign classes to teachers
- **System Oversight**: Monitor all results and system activity
- **Session Management**: Manage academic sessions and terms

### For Teachers
- **Result Creation**: Generate midterm and examination results
- **Auto-Calculations**: Automatic grade, position, and average calculations
- **Template System**: Pre-configured templates for Nursery, Kindergarten, and Primary
- **PDF Generation**: Professional result sheets with school logo
- **Publishing Control**: Publish results for parent access

### For Parents
- **Ward Management**: Register and manage children
- **Result Access**: View published results by term
- **PDF Download**: Download and print result sheets
- **Secure Access**: Role-based authentication

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: ShadCN/UI, Radix UI
- **Backend**: Appwrite (Authentication, Database, Storage)
- **State Management**: Zustand
- **PDF Generation**: @react-pdf/renderer

## 📋 Prerequisites

- Node.js 18+ installed
- Appwrite Cloud account (free) or self-hosted instance
- Modern web browser

## 🚀 Quick Start

###  1. Installation

```bash
# Clone or extract the project
cd result-generation-system

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Appwrite credentials
```

### 3. Appwrite Configuration

1. Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Create a database
3. Create collections (see SETUP_GUIDE.md for details):
   - users
   - auth_codes
   - students
   - results
   - classes
   - sessions
4. Create a storage bucket for PDFs
5. Update .env.local with your IDs

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference

## 🏗️ Project Structure

```
result-generation-system/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── teacher/           # Teacher dashboard
│   │   └── parent/            # Parent dashboard
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── layout/           # Layout components
│   │   └── shared/           # Shared components
│   ├── lib/                   # Core libraries
│   │   ├── services/         # Backend services
│   │   └── utils/            # Utility functions
│   ├── store/                 # State management
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
└── [config files]            # Configuration files
```

## 🎯 Nigerian Education Support

### Grading Scale
- **A (75-100)**: Excellent
- **B (65-74)**: Very Good
- **C (55-64)**: Good
- **D (45-54)**: Fair
- **E (40-44)**: Pass
- **F (0-39)**: Fail

### Templates
- **Nursery**: Descriptive grading system
- **Kindergarten**: Developmental assessment
- **Primary**: Numeric scoring with 11 subjects

## 🔐 Security Features

- Role-based access control (Admin, Teacher, Parent)
- 6-digit authorization codes with expiry
- Secure session management
- Protected API endpoints

## 📱 Responsive Design

- Mobile-first approach
- Tablet-optimized layouts
- Desktop-enhanced features

## 🤝 Support

For issues, questions, or contributions, please refer to the documentation or create an issue.

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with Next.js and Appwrite
- UI components from ShadCN/UI
- Icons from Lucide React

---

**Result Generation System** - Empowering Nigerian schools with modern result management.