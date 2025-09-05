import { database } from './database';
import { type Candidate, type InsertCandidate } from '@shared/schema';

export class MongoStorage {
  async getAllCandidates(): Promise<Candidate[]> {
    const collection = database.getCandidatesCollection();
    const candidates = await collection.find({}).toArray();
    
    // Convert MongoDB _id to id for consistency
    return candidates.map(candidate => ({
      ...candidate,
      id: candidate._id?.toString() || candidate.id,
      _id: undefined
    })) as Candidate[];
  }

  async getCandidate(id: number): Promise<Candidate | null> {
    const collection = database.getCandidatesCollection();
    const candidate = await collection.findOne({ id });
    
    if (!candidate) return null;
    
    return {
      ...candidate,
      id: candidate._id?.toString() || candidate.id,
      _id: undefined
    } as Candidate;
  }

  async getCandidateByAadhar(aadhar: string): Promise<Candidate | null> {
    const collection = database.getCandidatesCollection();
    const candidate = await collection.findOne({ aadhar });
    
    if (!candidate) return null;
    
    return {
      ...candidate,
      id: candidate._id?.toString() || candidate.id,
      _id: undefined
    } as Candidate;
  }

  async getCandidateByMobile(mobile: string): Promise<Candidate | null> {
    const collection = database.getCandidatesCollection();
    const candidate = await collection.findOne({ mobile });
    
    if (!candidate) return null;
    
    return {
      ...candidate,
      id: candidate._id?.toString() || candidate.id,
      _id: undefined
    } as Candidate;
  }

  async createCandidate(candidateData: InsertCandidate, candidateId: string): Promise<Candidate> {
    const collection = database.getCandidatesCollection();
    
    // Get next sequential ID
    const lastCandidate = await collection.findOne({}, { sort: { id: -1 } });
    const nextId = (lastCandidate?.id || 0) + 1;
    
    const newCandidate = {
      ...candidateData,
      id: nextId,
      candidateId,
      createdAt: new Date(),
      trained: false,
      status: 'Not Enrolled'
    };

    await collection.insertOne(newCandidate as any);
    
    return newCandidate as Candidate;
  }

  async updateCandidate(id: number, updateData: Partial<InsertCandidate>): Promise<Candidate | null> {
    const collection = database.getCandidatesCollection();
    
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    return {
      ...result,
      id: result._id?.toString() || result.id,
      _id: undefined
    } as Candidate;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    const collection = database.getCandidatesCollection();
    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async deleteAllCandidates(): Promise<boolean> {
    const collection = database.getCandidatesCollection();
    await collection.deleteMany({});
    return true;
  }
}