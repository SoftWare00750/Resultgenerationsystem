# Deployment Guide - Result Generation System

## Prerequisites

- Node.js 18+ installed
- Appwrite project configured
- All environment variables set

## Environment Variables

Create a `.env.local` file with:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_AUTH_CODES_COLLECTION_ID=auth_codes
NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID=students
NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID=results
NEXT_PUBLIC_APPWRITE_CLASSES_COLLECTION_ID=classes
NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID=sessions
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Self-Hosted
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t rgs-app .
docker run -p 3000:3000 --env-file .env.local rgs-app
```

## Post-Deployment

1. Create first admin user in Appwrite
2. Generate auth codes for teachers/parents
3. Test all functionality
4. Monitor error logs

## Security Checklist

- [ ] All environment variables are set
- [ ] Appwrite permissions configured correctly
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place

## Maintenance

- Regular backups of Appwrite database
- Monitor application logs
- Update dependencies monthly
- Review user feedback

---

For support, contact: support@rgs.com