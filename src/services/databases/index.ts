/* eslint-disable camelcase */
import { createAWS_RDSService } from "../providers/aws/index.ts";
import { Service } from "../services.ts";

export const createPostgresService = async (name: string, provider: string): Promise<{
    finished: boolean;
    service: Service;
}> => {
  // Implementation for creating a PostgreSQL service
  switch (provider) {
    case "aws": {
        // Create AWS RDS PostgreSQL service
        const { finished, service: createdService } = await createAWS_RDSService(name, "postgres");
        if (finished) {
          return { finished, service: createdService };
        }

        break;
    }

    default: {
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Fallback return to satisfy all code paths
  throw new Error("Failed to create Postgres service.");
}
