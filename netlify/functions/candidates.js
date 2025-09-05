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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const db = await connectToDatabase();
    const candidatesCollection = db.collection('candidates');
    
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : null;
    const path = event.path.replace('/.netlify/functions/candidates', '') || '';

    // GET /api/candidates - Get all candidates
    if (method === 'GET' && path === '') {
      const candidates = await candidatesCollection.find({}).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(candidates),
      };
    }

    // GET /api/candidates/:id - Get candidate by ID
    if (method === 'GET' && path.match(/^\/\d+$/)) {
      const id = parseInt(path.slice(1));
      const candidate = await candidatesCollection.findOne({ id });
      
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
    }

    // POST /api/candidates - Create new candidate
    if (method === 'POST' && path === '') {
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
    }

    // POST /api/candidates/bulk-import - Bulk import candidates
    if (method === 'POST' && path === '/bulk-import') {
      const { candidates } = body;
      
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No candidates data provided' }),
        };
      }

      const results = [];
      const errors = [];
      const existingCount = await candidatesCollection.countDocuments();
      let nextId = existingCount + 1;

      for (const candidateData of candidates) {
        try {
          // Check duplicates
          const existingByAadhar = await candidatesCollection.findOne({ aadhar: candidateData.aadhar });
          const existingByMobile = await candidatesCollection.findOne({ mobile: candidateData.mobile });
          
          if (existingByAadhar || existingByMobile) {
            errors.push({
              name: candidateData.name,
              aadhar: candidateData.aadhar,
              error: 'Candidate already exists'
            });
            continue;
          }

          const candidateId = `TRN${String(nextId).padStart(3, '0')}`;
          
          const candidate = {
            ...candidateData,
            id: nextId,
            candidateId,
            createdAt: new Date(),
            trained: false,
            status: 'Not Enrolled'
          };
          
          await candidatesCollection.insertOne(candidate);
          
          results.push({
            name: candidate.name,
            candidateId: candidate.candidateId,
            status: 'success'
          });
          
          nextId++;
        } catch (error) {
          errors.push({
            name: candidateData.name || 'Unknown',
            aadhar: candidateData.aadhar || 'Unknown',
            error: error.message
          });
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          imported: results.length,
          errorCount: errors.length,
          results,
          errors
        }),
      };
    }

    // PUT /api/candidates/:id - Update candidate
    if (method === 'PUT' && path.match(/^\/\d+$/)) {
      const id = parseInt(path.slice(1));
      
      const result = await candidatesCollection.updateOne(
        { id },
        { 
          $set: { 
            ...body, 
            updatedAt: new Date() 
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Candidate not found' }),
        };
      }
      
      const updatedCandidate = await candidatesCollection.findOne({ id });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedCandidate),
      };
    }

    // DELETE /api/candidates/:id - Delete candidate
    if (method === 'DELETE' && path.match(/^\/\d+$/)) {
      const id = parseInt(path.slice(1));
      
      const result = await candidatesCollection.deleteOne({ id });
      
      if (result.deletedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Candidate not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Candidate deleted successfully' }),
      };
    }

    // POST /api/candidates/bulk-import - Bulk import
    if (method === 'POST' && path === '/bulk-import') {
      const { candidates } = body;
      
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No candidates data provided' }),
        };
      }

      const results = [];
      const errors = [];
      const existingCount = await candidatesCollection.countDocuments();
      let nextId = existingCount + 1;

      for (const candidateData of candidates) {
        try {
          // Check duplicates
          const existingByAadhar = await candidatesCollection.findOne({ aadhar: candidateData.aadhar });
          const existingByMobile = await candidatesCollection.findOne({ mobile: candidateData.mobile });
          
          if (existingByAadhar || existingByMobile) {
            errors.push({
              name: candidateData.name,
              aadhar: candidateData.aadhar,
              error: 'Candidate already exists'
            });
            continue;
          }

          const candidateId = `TRN${String(nextId).padStart(3, '0')}`;
          
          const candidate = {
            ...candidateData,
            id: nextId,
            candidateId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await candidatesCollection.insertOne(candidate);
          
          results.push({
            name: candidate.name,
            candidateId: candidate.candidateId,
            status: 'success'
          });
          
          nextId++;
        } catch (error) {
          errors.push({
            name: candidateData.name || 'Unknown',
            aadhar: candidateData.aadhar || 'Unknown',
            error: error.message
          });
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          imported: results.length,
          errorCount: errors.length,
          results,
          errors
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};