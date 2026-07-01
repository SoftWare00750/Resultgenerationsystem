# Complete Setup Guide - Result Generation System

## 📋 Overview

This guide will walk you through setting up the complete Result Generation System with Appwrite backend.

## ⏱️ Estimated Time: 20-30 minutes

---

## Step 1: Prerequisites

Ensure you have:
- ✅ Node.js 18 or higher installed
- ✅ A code editor (VS Code recommended)
- ✅ Git installed (optional)
- ✅ An Appwrite Cloud account (free at cloud.appwrite.io)

---

## Step 2: Project Setup

```bash
# Navigate to project directory
cd result-generation-system

# Install dependencies
npm install

# This will install all required packages including:
# - Next.js 14
# - Appwrite SDK
# - UI components
# - PDF generation libraries
```

---

## Step 3: Appwrite Setup

### 3.1 Create Appwrite Project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up or log in
3. Click "Create Project"
4. Name: "Result Generation System"
5. Copy your **Project ID**

### 3.2 Create Database

1. In your project, go to "Databases"
2. Click "Create Database"
3. Name: "rgs_database"
4. Copy your **Database ID**

### 3.3 Create Collections

Create these 6 collections with the following attributes:

#### Collection 1: users
```
Name: users
```
**Attributes:**
- `email` (String, 255, required)
- `name` (String, 255, required)
- `role` (String, 50, required)
- `phone` (String, 20, optional)
- `assignedClasses` (String, 5000, optional)
- `createdAt` (String, 100, required)

**Indexes:**
- Key: email_idx, Type: unique, Attributes: [email]

**Permissions:**
- Read: Any
- Create: Any
- Update: Users
- Delete: Users

#### Collection 2: auth_codes
```
Name: auth_codes
```
**Attributes:**
- `code` (String, 6, required)
- `role` (String, 50, required)
- `isUsed` (Boolean, required)
- `expiresAt` (String, 100, required)
- `createdBy` (String, 100, required)
- `usedBy` (String, 100, optional)
- `createdAt` (String, 100, required)

**Indexes:**
- Key: code_idx, Type: unique, Attributes: [code]

**Permissions:**
- Read: Any
- Create: Users
- Update: Users
- Delete: Users

#### Collection 3: students
```
Name: students
```
**Attributes:**
- `name` (String, 255, required)
- `admissionNumber` (String, 50, required)
- `class` (String, 50, required)
- `parentId` (String, 100, required)
- `dateOfBirth` (String, 100, optional)
- `gender` (String, 10, optional)
- `address` (String, 500, optional)
- `guardianName` (String, 255, optional)
- `guardianPhone` (String, 20, optional)
- `createdAt` (String, 100, required)

**Indexes:**
- Key: admission_idx, Type: unique, Attributes: [admissionNumber]
- Key: parent_idx, Type: key, Attributes: [parentId]

**Permissions:**
- Read: Users
- Create: Users
- Update: Users
- Delete: Users

#### Collection 4: results
```
Name: results
```
**Attributes:**
- `studentId` (String, 100, required)
- `studentName` (String, 255, required)
- `admissionNumber` (String, 50, required)
- `class` (String, 50, required)
- `term` (String, 20, required)
- `session` (String, 20, required)
- `resultType` (String, 20, required)
- `subjects` (String, 10000, required)
- `totalScore` (Integer, optional)
- `averageScore` (Float, optional)
- `position` (Integer, optional)
- `overallGrade` (String, 5, optional)
- `teacherComment` (String, 1000, optional)
- `principalComment` (String, 1000, optional)
- `published` (Boolean, required)
- `pdfUrl` (String, 500, optional)
- `createdBy` (String, 100, required)
- `createdAt` (String, 100, required)
- `updatedAt` (String, 100, required)

**Indexes:**
- Key: student_idx, Type: key, Attributes: [studentId]
- Key: class_idx, Type: key, Attributes: [class]

**Permissions:**
- Read: Users
- Create: Users
- Update: Users
- Delete: Users

#### Collection 5: classes
```
Name: classes
```
**Attributes:**
- `name` (String, 100, required)
- `category` (String, 50, required)
- `assignedTeacherId` (String, 100, optional)
- `students` (String, 10000, required)
- `createdAt` (String, 100, required)

**Indexes:**
- Key: name_idx, Type: unique, Attributes: [name]

**Permissions:**
- Read: Users
- Create: Users
- Update: Users
- Delete: Users

#### Collection 6: sessions
```
Name: sessions
```
**Attributes:**
- `year` (String, 20, required)
- `isActive` (Boolean, required)
- `createdAt` (String, 100, required)

**Indexes:**
- Key: year_idx, Type: unique, Attributes: [year]

**Permissions:**
- Read: Users
- Create: Users
- Update: Users
- Delete: Users

### 3.4 Create Storage Bucket

1. Go to "Storage" in your Appwrite console
2. Click "Create Bucket"
3. Name: "rgs_pdfs"
4. Permissions: Users (Read, Create)
5. Maximum File Size: 10MB
6. Allowed File Extensions: pdf
7. Copy your **Bucket ID**

---

## Step 4: Environment Configuration

Create `.env.local` file in the project root:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id_here

NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_AUTH_CODES_COLLECTION_ID=auth_codes
NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID=students
NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID=results
NEXT_PUBLIC_APPWRITE_CLASSES_COLLECTION_ID=classes
NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=sessions
```

Replace the IDs with your actual Appwrite IDs.

---

## Step 5: Create Admin User

1. Go to your Appwrite console
2. Navigate to "Auth" → "Users"
3. Click "Create User"
4. Fill in:
   - Email: admin@school.com
   - Password: (choose a strong password)
   - Name: System Administrator
5. Copy the User ID

6. Go to "Databases" → "users" collection
7. Click "Create Document"
8. Fill in:
```json
{
  "email": "admin@school.com",
  "name": "System Administrator",
  "role": "admin",
  "phone": "",
  "assignedClasses": "[]",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Step 6: Run the Application

```bash
# Start development server
npm run dev
```

Visit: `http://localhost:3000`

### First Login
- Email: admin@school.com
- Password: (the password you set)

---

## Step 7: System Configuration

After logging in as admin:

1. **Generate Auth Codes**
   - Go to Auth Codes section
   - Generate codes for teachers and parents
   - Share codes with respective users

2. **Create Classes**
   - Go to Classes section
   - Add classes (Nursery 1, KG 1, Primary 1, etc.)
   - Assign teachers to classes

3. **Create Sessions**
   - Go to Sessions section
   - Add academic session (e.g., "2024/2025")
   - Set as active

---

## ✅ Verification Checklist

- [ ] Appwrite project created
- [ ] Database and all 6 collections created with correct attributes
- [ ] Storage bucket created
- [ ] Environment variables configured
- [ ] Admin user created in both Auth and Database
- [ ] Application runs without errors
- [ ] Can login as admin
- [ ] Can generate auth codes
- [ ] Can create classes

---

## 🎉 Success!

Your Result Generation System is now ready to use!

### Next Steps:
1. Register teachers using generated auth codes
2. Register parents using generated auth codes
3. Teachers can add students
4. Teachers can create and publish results
5. Parents can view their wards' results

---

## 🆘 Troubleshooting

### Cannot connect to Appwrite
- Verify your Project ID in .env.local
- Check your internet connection
- Ensure Appwrite endpoint is correct

### Login fails
- Verify admin user exists in both Auth and Database
- Check email and password
- Ensure user role is set to "admin"

### Collections not found
- Verify all collection IDs in .env.local match Appwrite
- Check collection names are exactly as specified

### Permission denied errors
- Review collection permissions
- Ensure all collections have Users permissions set

---

## 📞 Need Help?

Refer to:
- README.md for general information
- DEPLOYMENT.md for production deployment
- Appwrite documentation at docs.appwrite.io