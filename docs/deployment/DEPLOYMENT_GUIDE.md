# Deployment Guide
# دليل النشر

**Version:** 1.0.0  
**Date:** 2025-10-15  
**Sprint:** 5.6 - التحسين النهائي والتجهيز للإنتاج

---

## 📋 Table of Contents | جدول المحتويات

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites | المتطلبات الأساسية

### System Requirements

- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **Operating System:** Windows 10/11, macOS 10.15+, or Linux
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** Minimum 2GB free space

### Required Tools

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Install dependencies
npm install
```

---

## 🌍 Environment Setup | إعداد البيئة

### 1. Create Production Environment File

Copy the example environment file:

```bash
cp .env.production.example .env.production
```

### 2. Configure Environment Variables

Edit `.env.production` and update the following critical variables:

```env
# Application
VITE_APP_NAME=Desktop Management System
VITE_APP_VERSION=1.0.0
VITE_BASE_URL=https://your-domain.com

# Security (IMPORTANT: Change these!)
VITE_JWT_SECRET=your-unique-jwt-secret-key
VITE_DB_ENCRYPTION_KEY=your-unique-encryption-key

# Database
VITE_DB_PATH=./data/production.db
VITE_DB_ENCRYPTION=true

# API
VITE_API_BASE_URL=https://api.your-domain.com
VITE_API_TIMEOUT=30000
```

### 3. Security Checklist

- [ ] Change `VITE_JWT_SECRET` to a strong random string
- [ ] Change `VITE_DB_ENCRYPTION_KEY` to a strong random string
- [ ] Set `VITE_ENABLE_HTTPS=true`
- [ ] Configure `VITE_ALLOWED_ORIGINS` with your domain
- [ ] Set `VITE_DEBUG=false`
- [ ] Set `VITE_SOURCE_MAPS=false`

---

## 🏗️ Build Process | عملية البناء

### 1. Clean Build

```bash
# Remove old build files
rm -rf dist build

# Clean install dependencies
npm ci
```

### 2. Run Tests

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Check test coverage
npm run test:coverage
```

### 3. Type Check

```bash
# Run TypeScript type checking
npm run type-check
```

### 4. Lint and Format

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format:fix
```

### 5. Build Application

```bash
# Build for production
npm run build

# Build Electron app (Windows)
npm run package:win32

# Build Electron app (macOS)
npm run package:darwin

# Build Electron app (Linux)
npm run package:linux
```

### 6. Verify Build

```bash
# Preview production build
npm run preview
```

---

## 🚀 Deployment Options | خيارات النشر

### Option 1: Desktop Application (Electron)

#### Windows

```bash
# Build Windows installer
npm run package:win32

# Output: dist/Desktop Management System Setup 1.0.0.exe
```

**Installation:**
1. Run the installer on target machine
2. Follow installation wizard
3. Application will be installed in `C:\Program Files\Desktop Management System`

#### macOS

```bash
# Build macOS app
npm run package:darwin

# Output: dist/Desktop Management System-1.0.0.dmg
```

**Installation:**
1. Open the DMG file
2. Drag application to Applications folder
3. Launch from Applications

#### Linux

```bash
# Build Linux package
npm run package:linux

# Output: dist/desktop-management-system_1.0.0_amd64.deb
```

**Installation:**
```bash
# Debian/Ubuntu
sudo dpkg -i desktop-management-system_1.0.0_amd64.deb

# Or use AppImage
chmod +x Desktop-Management-System-1.0.0.AppImage
./Desktop-Management-System-1.0.0.AppImage
```

### Option 2: Web Application

#### Static Hosting (Netlify, Vercel, etc.)

```bash
# Build web version
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Deploy to Vercel
vercel --prod
```

#### Self-Hosted (Nginx)

1. **Build application:**
```bash
npm run build
```

2. **Copy files to server:**
```bash
scp -r dist/* user@server:/var/www/dms
```

3. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Root directory
    root /var/www/dms;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. **Restart Nginx:**
```bash
sudo systemctl restart nginx
```

### Option 3: Docker Container

1. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

2. **Build Docker image:**
```bash
docker build -t dms:1.0.0 .
```

3. **Run container:**
```bash
docker run -d -p 80:80 --name dms dms:1.0.0
```

4. **Docker Compose:**
```yaml
version: '3.8'

services:
  dms:
    image: dms:1.0.0
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

## ✅ Post-Deployment | ما بعد النشر

### 1. Verify Installation

- [ ] Application launches successfully
- [ ] Database connection works
- [ ] All features are accessible
- [ ] No console errors
- [ ] Performance is acceptable

### 2. Initial Configuration

1. **Create admin user:**
   - Launch application
   - Complete initial setup wizard
   - Create super admin account

2. **Configure settings:**
   - Set company information
   - Configure localization (language, timezone, currency)
   - Set up backup schedule
   - Configure integrations (if needed)

3. **Import data (if migrating):**
   - Use backup import feature
   - Verify data integrity
   - Test critical workflows

### 3. Security Hardening

- [ ] Change default passwords
- [ ] Enable two-factor authentication
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Enable audit logging
- [ ] Configure backup encryption

### 4. Monitoring Setup

- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts

### 5. Backup Configuration

```bash
# Test backup creation
npm run backup:export

# Verify backup file
ls -lh backups/

# Test backup restoration
npm run backup:import backups/backup-YYYY-MM-DD.json
```

### 6. Performance Testing

- [ ] Test page load times
- [ ] Test large data sets
- [ ] Test concurrent users
- [ ] Monitor memory usage
- [ ] Check network performance

---

## 🔍 Troubleshooting | استكشاف الأخطاء

### Common Issues

#### 1. Build Fails

**Problem:** Build process fails with errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist build .vite

# Try build again
npm run build
```

#### 2. Application Won't Start

**Problem:** Application fails to launch

**Solution:**
- Check Node.js version: `node --version`
- Check for port conflicts
- Review error logs in console
- Verify environment variables
- Check file permissions

#### 3. Database Connection Error

**Problem:** Cannot connect to database

**Solution:**
- Verify database file path
- Check file permissions
- Ensure encryption key is correct
- Try creating new database

#### 4. Performance Issues

**Problem:** Application is slow

**Solution:**
- Clear browser cache
- Check memory usage
- Optimize database queries
- Enable caching
- Review performance metrics

#### 5. SSL/HTTPS Issues

**Problem:** SSL certificate errors

**Solution:**
- Verify certificate is valid
- Check certificate chain
- Ensure correct domain name
- Update certificate if expired

### Getting Help

- **Documentation:** Check `/docs` folder
- **Logs:** Review application logs in `/logs`
- **Support:** Contact support team
- **Community:** Check GitHub issues

---

## 📊 Deployment Checklist | قائمة التحقق من النشر

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup plan in place

### Deployment
- [ ] Build successful
- [ ] Application deployed
- [ ] Database migrated
- [ ] SSL configured
- [ ] Monitoring enabled
- [ ] Backups configured

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Admin account created
- [ ] Settings configured
- [ ] Data imported (if applicable)
- [ ] Performance verified
- [ ] Team trained
- [ ] Documentation distributed

---

## 📝 Notes | ملاحظات

- Always test in staging environment before production
- Keep backups of previous version
- Document any custom configurations
- Monitor application for first 24 hours after deployment
- Have rollback plan ready

---

*End of Deployment Guide*

