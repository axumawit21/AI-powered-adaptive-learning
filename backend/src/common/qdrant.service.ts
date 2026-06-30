import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({ url: 'http://localhost:6333' });
  }

  /** Search a collection for relevant chunks */
  async searchCollection(collectionName: string, queryVector: number[], limit = 4, filter?: any) {
    try {
      const results = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
        filter,
      });

      return results
        .filter((r) => r.payload != null)
        .map((r) => r.payload!.text)
        .filter(Boolean);
    } catch (err) {
      console.error('Qdrant search error:', err);
      return [];
    }
  }
}
