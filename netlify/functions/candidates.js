const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');
const { pgTable, text, serial, boolean, timestamp } = require('drizzle-orm/pg-core');

// Define schema for Netlify functions
const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  candidateId: text("candidate_id").notNull().unique(),
  srNo: text("sr_no"),
  location: text("location").notNull(),
  name: text("name").notNull(),
  aadhar: text("aadhar").notNull().unique(),
  dob: text("dob").notNull(),
  gender: text("gender").notNull(),
  religion: text("religion"),
  vulnerability: text("vulnerability"),
  annualIncome: text("annual_income"),
  educationalQualification: text("educational_qualification"),
  mobile: text("mobile").notNull(),
  assessmentDate: text("assessment_date"),
  dlNo: text("dl_no"),
  dlType: text("dl_type"),
  licenseExpiryDate: text("license_expiry_date"),
  dependentFamilyMembers: text("dependent_family_members"),
  ownerDriver: text("owner_driver"),
  abhaNo: text("abha_no"),
  jobRole: text("job_role"),
  jobCode: text("job_code"),
  emailAddress: text("email_address"),
  youTube: text("you_tube"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  ekycStatus: text("ekyc_status"),
  personalEmailAddress: text("personal_email_address"),
  trained: boolean("trained").notNull().default(false),
  status: text("status").notNull().default('Not Enrolled'),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const sql = neon(process.env.DATABASE_URL);
  cachedDb = drizzle(sql, { schema: { candidates } });
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
    
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : null;

    // GET /api/candidates - Get all candidates
    if (method === 'GET') {
      const candidatesData = await db.select().from(candidates);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(candidatesData),
      };
    }

    // GET /api/candidates/:id - Get candidate by ID
    if (method === 'GET' && path.match(/^\/\d+$/)) {
      const id = parseInt(path.slice(1));
      const result = await db.select().from(candidates).where(eq(candidates.id, id));
      const candidate = result[0] || null;
      
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

    // POST /api/candidates/search - Search candidates
    if (method === 'POST' && path === '/search') {
      const { aadhar, mobile } = body;
      
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
      
      let result;
      if (aadhar) {
        result = await db.select().from(candidates).where(eq(candidates.aadhar, aadhar));
      } else if (mobile) {
        result = await db.select().from(candidates).where(eq(candidates.mobile, mobile));
      }
      const candidate = result[0] || null;
      
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
      const existingByAadharResult = await db.select().from(candidates).where(eq(candidates.aadhar, body.aadhar));
      const existingByMobileResult = await db.select().from(candidates).where(eq(candidates.mobile, body.mobile));
      const existingByAadhar = existingByAadharResult[0] || null;
      const existingByMobile = existingByMobileResult[0] || null;
      
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
      const allCandidates = await db.select().from(candidates);
      const count = allCandidates.length;
      const candidateId = `TRN${String(count + 1).padStart(3, '0')}`;
      
      const candidateData = {
        ...body,
        candidateId,
      };
      
      const result = await db.insert(candidates).values(candidateData).returning();
      const candidate = result[0];
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(candidate),
      };
    }

    // PUT /api/candidates/:id - Update candidate
    if (method === 'PUT' && path.match(/^\/\d+$/)) {
      const id = parseInt(path.slice(1));
      
      const result = await db.update(candidates)
        .set(body)
        .where(eq(candidates.id, id))
        .returning();
      
      if (result.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Candidate not found' }),
        };
      }
      
      const updatedCandidate = result[0];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedCandidate),
      };
    }

    // DELETE /api/candidates/:id - Delete candidate
    if (method === 'DELETE' && path.match(/^\/\d+$/)) {
      const id = parseInt(path.slice(1));
      
      const result = await db.delete(candidates).where(eq(candidates.id, id)).returning();
      
      if (result.length === 0) {
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
      const allExisting = await db.select().from(candidates);
      let nextCandidateNumber = allExisting.length + 1;

      for (const candidateData of candidates) {
        try {
          // Check duplicates
          const existingByAadharResult = await db.select().from(candidates).where(eq(candidates.aadhar, candidateData.aadhar));
          const existingByMobileResult = await db.select().from(candidates).where(eq(candidates.mobile, candidateData.mobile));
          const existingByAadhar = existingByAadharResult[0] || null;
          const existingByMobile = existingByMobileResult[0] || null;
          
          if (existingByAadhar || existingByMobile) {
            errors.push({
              name: candidateData.name,
              aadhar: candidateData.aadhar,
              error: 'Candidate already exists'
            });
            continue;
          }

          const candidateId = `TRN${String(nextCandidateNumber).padStart(3, '0')}`;
          
          const newCandidateData = {
            ...candidateData,
            candidateId,
          };
          
          const result = await db.insert(candidates).values(newCandidateData).returning();
          const candidate = result[0];
          
          results.push({
            name: candidate.name,
            candidateId: candidate.candidateId,
            status: 'success'
          });
          
          nextCandidateNumber++;
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