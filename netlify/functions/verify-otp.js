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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  try {
    const db = await connectToDatabase();
    const otpCollection = db.collection('otps');
    
    const { phoneNumber, otp } = JSON.parse(event.body);
    
    if (!phoneNumber || !otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number and OTP required' }),
      };
    }

    const storedData = await otpCollection.findOne({ phoneNumber });
    
    if (!storedData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No OTP found for this number' }),
      };
    }

    // Check if OTP is expired (5 minutes)
    const isExpired = Date.now() - storedData.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      await otpCollection.deleteOne({ phoneNumber });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'OTP has expired' }),
      };
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      await otpCollection.deleteOne({ phoneNumber });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Maximum verification attempts exceeded' }),
      };
    }

    // Verify OTP
    if (storedData.otp === otp) {
      await otpCollection.deleteOne({ phoneNumber });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'OTP verified successfully' }),
      };
    } else {
      await otpCollection.updateOne(
        { phoneNumber },
        { $inc: { attempts: 1 } }
      );
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid OTP', 
          attemptsLeft: 3 - (storedData.attempts + 1)
        }),
      };
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to verify OTP' }),
    };
  }
};