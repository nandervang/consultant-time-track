// MongoDB Monitoring Service
// This is a backend service that handles actual MongoDB connections
// Deploy this to Vercel, Netlify Functions, or your preferred serverless platform

const { MongoClient } = require('mongodb');

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI; // Set this in your environment
const WEBHOOK_SECRET = process.env.MONGODB_WEBHOOK_SECRET; // Set this in your environment

if (!MONGODB_URI || !WEBHOOK_SECRET) {
  throw new Error('MONGODB_URI and MONGODB_WEBHOOK_SECRET environment variables are required');
}

/**
 * MongoDB Monitoring API Endpoint
 * POST /api/mongodb-monitor
 * 
 * Body: {
 *   uri: string,
 *   database: string,
 *   collection: string,
 *   operation: 'ping' | 'count' | 'find',
 *   query?: string
 * }
 */
async function mongoDBMonitor(req, res) {
  // Verify webhook secret
  const authHeader = req.headers.authorization;
  if (authHeader !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { uri, database, collection = 'partners', operation = 'ping', query = '{}' } = req.body;
  
  let client;
  const startTime = Date.now();
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri || MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000,
      maxPoolSize: 10
    });
    
    await client.connect();
    
    const db = client.db(database || 'digitalidag');
    const coll = db.collection(collection);
    
    let result;
    
    switch (operation) {
      case 'count':
        // Count documents in collection
        const filter = query ? JSON.parse(query) : {};
        const count = await coll.countDocuments(filter);
        result = {
          operation: 'count',
          collection,
          filter,
          count,
          message: `Found ${count} documents in ${database}.${collection}`
        };
        break;
        
      case 'find':
        // Find documents (limit to 5 for performance)
        const findFilter = query ? JSON.parse(query) : {};
        const documents = await coll.find(findFilter).limit(5).toArray();
        result = {
          operation: 'find',
          collection,
          filter: findFilter,
          count: documents.length,
          documents: documents.map(doc => ({ _id: doc._id })), // Only return IDs for privacy
          message: `Found ${documents.length} documents matching query`
        };
        break;
        
      case 'ping':
      default:
        // Basic connection test
        await db.admin().ping();
        result = {
          operation: 'ping',
          database,
          message: `Successfully connected to ${database}`
        };
        break;
    }
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'success',
      responseTime,
      ...result
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('MongoDB monitoring error:', error);
    
    res.status(500).json({
      status: 'failure',
      responseTime,
      error: error.message,
      code: error.code
    });
    
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// For Vercel deployment
module.exports = mongoDBMonitor;

// For Express.js deployment
// app.post('/api/mongodb-monitor', mongoDBMonitor);

// Sample usage:
/*
curl -X POST https://your-api.vercel.app/api/mongodb-monitor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hNt(o-Z3HJnE_X?R@N[m0p" \
  -d '{
    "database": "digitalidag",
    "collection": "partners",
    "operation": "count"
  }'
*/
