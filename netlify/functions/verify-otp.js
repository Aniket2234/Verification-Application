// OTP storage (shared with send-otp function)
let otpStore = new Map();

export const handler = async (event, context) => {
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
    const { phoneNumber, otp } = JSON.parse(event.body);
    
    if (!phoneNumber || !otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number and OTP required' }),
      };
    }

    const storedData = otpStore.get(phoneNumber);
    
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
      otpStore.delete(phoneNumber);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'OTP has expired' }),
      };
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(phoneNumber);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Maximum verification attempts exceeded' }),
      };
    }

    // Verify OTP
    if (storedData.otp === otp) {
      otpStore.delete(phoneNumber);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'OTP verified successfully' }),
      };
    } else {
      storedData.attempts += 1;
      otpStore.set(phoneNumber, storedData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid OTP', 
          attemptsLeft: 3 - storedData.attempts 
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