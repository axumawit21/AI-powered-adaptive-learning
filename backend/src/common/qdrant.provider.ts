import { Provider } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

export const QDRANT = 'QDRANT_CLIENT';

export const qdrantProvider: Provider = {
  provide: QDRANT,
  useFactory: async () => {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    const client = new QdrantClient({
      url,
      ...(apiKey && { apiKey }),
    });
    console.log('✅ Connected to Qdrant at', url, apiKey ? '(with API key)' : '(no auth)');
    return client;
  },
};