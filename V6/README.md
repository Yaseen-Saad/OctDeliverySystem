# Group Order System

A collaborative food ordering system that allows groups to coordinate their orders, track payments, and manage deliveries.

## Fixed Deployment Guide

### 1. Prerequisites

1. Create accounts for:
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free Tier)
   - [Vercel](https://vercel.com) (Free Tier)

2. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

### 2. MongoDB Atlas Setup

1. Create a free cluster:
   - Choose "Shared Clusters" (Free)
   - Select closest region
   - Choose M0 Sandbox

2. Set up database access:
   - Create a database user
   - Use a strong password
   - Save credentials

3. Network access:
   - Add `0.0.0.0/0` to IP whitelist
   - This allows Vercel to connect

4. Get connection string:
   - Go to Cluster > Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

### 3. Environment Setup

1. Create .env file from template:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_random_secure_string
   NODE_ENV=production
   ```

### 4. Vercel Deployment

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy the application:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Project Settings > Environment Variables
   - Add MONGODB_URI and SESSION_SECRET
   - These should match your .env values

4. Force HTTPS:
   - Project Settings > Functions
   - Enable "Force HTTPS"

### 5. Post-Deployment Setup

1. Run database initialization:
   ```bash
   vercel env pull .env.production.local
   vercel run src/scripts/createAdmin.js
   vercel run src/scripts/createRestaurants.js
   ```

2. Default admin credentials:
   - Username: admin
   - Password: admin123
   - **Change these immediately after first login**

### 6. Troubleshooting Common Issues

1. View Error Not Found:
   - Ensure all views are in src/views directory
   - Check file permissions
   - Verify file extensions are .ejs

2. MongoDB Connection:
   - Verify MONGODB_URI in Vercel dashboard
   - Check IP whitelist in MongoDB Atlas
   - Ensure cluster is running

3. Session Issues:
   - Verify SESSION_SECRET is set
   - Check connect-mongo configuration
   - Monitor session storage

4. Deployment Fails:
   - Check vercel.json configuration
   - Verify all dependencies are listed in package.json
   - Look for build errors in Vercel dashboard

### 7. Monitoring

1. Vercel Dashboard:
   - View deployment status
   - Check function logs
   - Monitor performance

2. MongoDB Atlas:
   - Monitor database connections
   - Check storage usage
   - View operation logs

3. Application Logs:
   - Access via Vercel dashboard
   - Check for errors
   - Monitor performance

### 8. Best Practices

1. Database:
   - Regular backups (automated in Atlas)
   - Monitor storage usage
   - Use indexes efficiently

2. Security:
   - Keep dependencies updated
   - Use secure session settings
   - Enable 2FA on Vercel and MongoDB

3. Performance:
   - Enable caching where possible
   - Optimize database queries
   - Monitor response times

### 9. Maintenance

1. Regular Tasks:
   - Update dependencies
   - Monitor error logs
   - Check storage usage
   - Review security settings

2. Database Cleanup:
   - Auto-deletion of old orders
   - Index optimization
   - Regular backups

3. Security Updates:
   - Keep Node.js updated
   - Update npm packages
   - Review access controls

## Support

For issues:
1. Check deployment logs in Vercel
2. Review MongoDB Atlas logs
3. Check application error logs
4. Consult documentation

Remember to:
- Monitor database usage
- Keep security settings updated
- Regularly backup data
- Update admin credentials