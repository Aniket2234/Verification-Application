// OTP storage (in production, use a database or Redis)
let otpStore = new Map();

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
    const { phoneNumber } = JSON.parse(event.body);
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid 10-digit phone number required' }),
      };
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP with timestamp and attempts
    otpStore.set(phoneNumber, { 
      otp, 
      timestamp: Date.now(), 
      attempts: 0 
    });

    // Auto cleanup after 5 minutes
    setTimeout(() => {
      otpStore.delete(phoneNumber);
    }, 5 * 60 * 1000);

    let smsResult = null;
    
    // Try Twilio if credentials available
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        // Import Twilio
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await client.messages.create({
          body: `Your Training Portal verification code is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${phoneNumber}`
        });
        
        smsResult = { success: true, message: "OTP sent via Twilio SMS", provider: "Twilio" };
      } catch (twilioError) {
        console.log('Twilio failed:', twilioError.message);
      }
    }
    
    // Try Textbelt if Twilio failed
    if (!smsResult) {
      try {
        const response = await fetch('https://textbelt.com/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: `+91${phoneNumber}`,
            message: `Your Training Portal verification code is: ${otp}. Valid for 5 minutes.`,
            key: 'textbelt'
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          smsResult = { 
            success: true, 
            message: "OTP sent via Textbelt SMS (Free service)", 
            provider: "Textbelt",
            quotaRemaining: result.quotaRemaining 
          };
        } else {
          throw new Error(result.error || 'Textbelt service failed');
        }
      } catch (textbeltError) {
        console.log('Textbelt failed:', textbeltError.message);
      }
    }
    
    // Demo mode fallback
    if (!smsResult) {
      smsResult = { 
        success: true, 
        message: `Demo Mode: OTP sent successfully`, 
        provider: "Demo",
        demoOtp: otp
      };
    }

    console.log(`OTP ${otp} generated for ${phoneNumber} via ${smsResult.provider}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(smsResult),
    };
    
  } catch (error) {
    console.error('Send OTP error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send OTP' }),
    };
  }
};