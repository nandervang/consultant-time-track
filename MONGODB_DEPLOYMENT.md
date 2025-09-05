# MongoDB Monitoring Service Deployment Guide

## Overview
This service provides real MongoDB connectivity monitoring for your ping widget. It connects to your MongoDB cluster and performs actual operations like counting documents, querying collections, and testing connections.

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Create a new Vercel project:**
   ```bash
   mkdir mongodb-monitor-api
   cd mongodb-monitor-api
   cp ../mongodb-monitoring-service.js ./api/mongodb-monitor.js
   cp ../mongodb-service-package.json ./package.json
   ```

2. **Create vercel.json:**
   ```json
   {
     "functions": {
       "api/mongodb-monitor.js": {
         "maxDuration": 10
       }
     }
   }
   ```

3. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

4. **Set environment variables in Vercel dashboard:**
   ```
   MONGODB_URI=mongodb+srv://app:YOUR_PASSWORD@digitalidag.khxg9ko.mongodb.net/digitalidag?retryWrites=true&w=majority&appName=DigitalIdag
   MONGODB_WEBHOOK_SECRET=Bearer hNt(o-Z3HJnE_X?R@N[m0p
   ```

### Option 2: Netlify Functions

1. **Create netlify/functions/mongodb-monitor.js:**
   ```javascript
   const mongoDBMonitor = require('../../mongodb-monitoring-service');
   
   exports.handler = async (event, context) => {
     const req = {
       headers: event.headers,
       body: JSON.parse(event.body || '{}')
     };
     
     const res = {
       status: (code) => ({ json: (data) => ({ statusCode: code, body: JSON.stringify(data) }) })
     };
     
     return await mongoDBMonitor(req, res);
   };
   ```

### Option 3: Railway

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package.json .
   RUN npm install
   COPY . .
   EXPOSE 3000
   CMD ["node", "mongodb-monitoring-service.js"]
   ```

2. **Deploy to Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

## Frontend Configuration

After deploying your service, update your frontend environment variables:

### .env.local
```bash
REACT_APP_MONGODB_API_ENDPOINT=https://your-mongodb-api.vercel.app/api/mongodb-monitor
REACT_APP_MONGODB_WEBHOOK_SECRET=Bearer hNt(o-Z3HJnE_X?R@N[m0p
```

## Testing the Service

### Using curl:
```bash
curl -X POST https://your-mongodb-api.vercel.app/api/mongodb-monitor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hNt(o-Z3HJnE_X?R@N[m0p" \
  -d '{
    "database": "digitalidag",
    "collection": "partners",
    "operation": "count"
  }'
```

### Expected Response:
```json
{
  "status": "success",
  "responseTime": 145,
  "operation": "count",
  "collection": "partners",
  "filter": {},
  "count": 42,
  "message": "Found 42 documents in digitalidag.partners"
}
```

## Operations Supported

1. **ping**: Basic connection test
2. **count**: Count documents in collection (returns actual user count)
3. **find**: Find documents with query filter

## Security Notes

- Always use environment variables for credentials
- Validate webhook secret on every request
- Limit connection timeout to prevent hanging requests
- Use connection pooling for better performance
- Consider IP whitelisting for production deployments

## Monitoring Widget Setup

Once deployed, your ping widget can:
1. Test MongoDB connectivity
2. Count actual users in your `partners` collection
3. Monitor database response times
4. Alert on connection failures

The widget will automatically use the real backend service if environment variables are configured, otherwise it falls back to simulation mode.
