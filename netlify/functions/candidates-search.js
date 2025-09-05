const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedDb = client.db('training_portal');
  return cachedDb;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check if MongoDB URI is available
  if (!process.env.MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database configuration missing' }),
    };
  }

  try {
    const db = await connectToDatabase();
    const candidatesCollection = db.collection('candidates');
    
    const { aadhar, mobile } = JSON.parse(event.body || '{}');
    
    let query = {};
    if (aadhar) query.aadhar = aadhar;
    if (mobile) query.mobile = mobile;
    
    if (Object.keys(query).length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Either aadhar or mobile is required' }),
      };
    }
    
    const candidate = await candidatesCollection.findOne(query);
    
    if (!candidate) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Candidate not found' }),
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(candidate),
    };

  } catch (error) {
    console.error('Search function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};