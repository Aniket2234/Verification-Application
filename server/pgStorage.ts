import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, or } from "drizzle-orm";
import { candidates, type Candidate, type InsertCandidate } from "@shared/schema";

export class PostgreSQLStorage {
  private db;
  private pool;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false // Replit's database doesn't require SSL
    });
    
    this.db = drizzle(this.pool);
  }

  async getAllCandidates(): Promise<Candidate[]> {
    try {
      const result = await this.db.select().from(candidates);
      return result;
    } catch (error) {
      console.error("Error fetching all candidates:", error);
      throw error;
    }
  }

  async getCandidate(id: number): Promise<Candidate | null> {
    try {
      const result = await this.db.select().from(candidates).where(eq(candidates.id, id));
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching candidate:", error);
      throw error;
    }
  }

  async getCandidateByAadhar(aadhar: string): Promise<Candidate | null> {
    try {
      const result = await this.db.select().from(candidates).where(eq(candidates.aadhar, aadhar));
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching candidate by aadhar:", error);
      throw error;
    }
  }

  async getCandidateByMobile(mobile: string): Promise<Candidate | null> {
    try {
      const result = await this.db.select().from(candidates).where(eq(candidates.mobile, mobile));
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching candidate by mobile:", error);
      throw error;
    }
  }

  async createCandidate(candidateData: InsertCandidate, candidateId: string): Promise<Candidate> {
    try {
      const newCandidate = {
        ...candidateData,
        candidateId
      };
      
      const result = await this.db.insert(candidates).values(newCandidate).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating candidate:", error);
      throw error;
    }
  }

  async updateCandidate(id: number, updateData: Partial<InsertCandidate>): Promise<Candidate | null> {
    try {
      const result = await this.db.update(candidates)
        .set(updateData)
        .where(eq(candidates.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating candidate:", error);
      throw error;
    }
  }

  async deleteCandidate(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(candidates).where(eq(candidates.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting candidate:", error);
      throw error;
    }
  }

  async deleteAllCandidates(): Promise<boolean> {
    try {
      await this.db.delete(candidates);
      return true;
    } catch (error) {
      console.error("Error deleting all candidates:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}