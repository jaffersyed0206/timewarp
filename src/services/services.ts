import { input, select } from "@inquirer/prompts";

import { retrieveDatabaseInstance, retrieveDockerImage } from "./providers/functions.ts";

export interface Service {
  dataDir?: string; // path to .timewarp/data/<dbName>
  dumpFile?: string; // path to .timewarp/snapshots/*.sql
  // Database specific
  engine?: "mariadb" | "mysql" | "oracle" | "postgres" | "sqlserver";
  envVars?: Record<string, string>; // environment variables

  id?: string; // optional unique ID (good for referencing without relying on name)
  // API / Web specific
  image?: string; // e.g., ECR or Docker Hub image
  name: string;
  ports?: string[]; // e.g., ["3000:3000"]

  provider: "aws" | "azure" | "gcp" | "local" | string;
  // Optional metadata
  serviceType?: string; // optional sub-categorization (e.g., "backend", "frontend")
  snapshotId?: string; // AWS RDS snapshot identifier
  tags?: Record<string, string>; // e.g., { env: "dev", team: "platform" }
  tempInstanceId?: string; // AWS temp instance ID used during snapshot restore
  type: "api" | "db" | "web";

  version?: string; // e.g., "15" for postgres, "8.0" for mysql
  volumes?: string[]; // for mounting local code/config into containers
}

export const addMultipleServices = async (services: Service[]): Promise<Service[]> => {
  const serviceType = await select({
    message: "What type of app do you want to onboard?",
    choices: [
      { name: "Web", value: "web" },
      { name: "API", value: "api" },
      { name: "Database", value: "db" },
    ],
  }) as "api" | "db" | "web";

  const serviceTypeLabel: string = serviceType === "api" ? "API" : serviceType === "db" ? "Database" : "Web"; 

  const serviceName = await input({
    message: `What is the name of this ${serviceTypeLabel} service?`,
    default: `my-${serviceType}-service`,
  });

  switch (serviceType) {
    case "api": {
      // Handle API service onboarding
      console.log("Onboarding API service...");
      const apiService: Service = await retrieveDockerImage(serviceName, { label: "API", value: "api" });
      services.push(apiService);
      console.log(`${serviceName} API service onboarded successfully.`);
      break;
    }

    case "db": {
      // Handle Database service onboarding
      console.log("Onboarding Database service...");
      const dbService: Service = await retrieveDatabaseInstance();
      console.log(dbService);
      services.push(dbService);
      console.log(`${serviceName} Database service onboarded successfully.`);
      break;
    }

    case "web": {
      // Handle Web service onboarding
      console.log("Onboarding Web service...");
      const webService: Service = await retrieveDockerImage(serviceName, { label: "Web", value: "web" });
      services.push(webService);
      console.log(`${serviceName} Web service onboarded successfully.`);
      break;
    }

    default: {
      break;
    }
  }

  const continueOnboarding = await input({
    message: "Do you want to add another service? (y/n)",
    default: "y",
  });

  if (continueOnboarding.toLowerCase() === "y" || continueOnboarding.toLowerCase() === "yes") {
    return addMultipleServices(services);
  }

  return services;
};

// TODO: Add a single service
export const addSingleService = async (): Promise<void> => {}

// TODO: Update multiple services
export const updateMultipleServices = async (): Promise<void> => {}

// TODO: process all long processors
export const processAllLongProcessors = (services: Service[]) => services