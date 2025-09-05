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
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const db = await connectToDatabase();
    const candidatesCollection = db.collection('candidates');
    
    const body = JSON.parse(event.body);
    
    // Check for duplicates
    const existingByAadhar = await candidatesCollection.findOne({ aadhar: body.aadhar });
    const existingByMobile = await candidatesCollection.findOne({ mobile: body.mobile });
    
    if (existingByAadhar) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Candidate with this Aadhar already exists' }),
      };
    }
    
    if (existingByMobile) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Candidate with this mobile number already exists' }),
      };
    }

    // Generate ID
    const count = await candidatesCollection.countDocuments();
    const candidateId = `TRN${String(count + 1).padStart(3, '0')}`;
    
    const candidate = {
      ...body,
      id: count + 1,
      candidateId,
      createdAt: new Date(),
      trained: false,
      status: 'Not Enrolled'
    };
    
    await candidatesCollection.insertOne(candidate);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(candidate),
    };

  } catch (error) {
    console.error('Create candidate function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};