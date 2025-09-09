/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable complexity */
/* eslint-disable no-await-in-loop */
 
/* eslint-disable unicorn/no-array-callback-reference */
/* eslint-disable unicorn/no-array-for-each */
/* eslint-disable no-return-await */
import { RDSClient } from "@aws-sdk/client-rds";
import { input, select } from "@inquirer/prompts";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

import { readConfig, TimewarpConfig } from "../config/index.ts";
import { processPostgresDatabaseDataDumpDir } from "./providers/aws/rds/postgres/index.ts";
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
  mysql?: {
    dbname?: string;
    password?: string;
    port?: number;
    username?: string;
  };
  name: string;

  ports?: string[]; // e.g., ["3000:3000"]

  postgres?: {
    dbname?: string;
    password?: string;
    port?: number;
    username?: string;
  };

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

  const initialServiceName = await input({
    message: `What is the name of this ${serviceTypeLabel} service?`,
    default: `my-${serviceType}-service`,
  });

  const config: TimewarpConfig = readConfig();

  const serviceName: string = await checkForExistingServices(initialServiceName, mergeServices(config.services, services));

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
      if (dbService) {
        services.push(dbService);
        console.log(`${serviceName} Database service onboarded successfully.`);
      }

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

export const checkForExistingServices = async (serviceName: string, services: Service[]): Promise<string> => {
  // Check for existing services
  if (services.some(service => service.name === serviceName)) {
    const renameService = await input({
      message: `Service ${serviceName} already exists. Please enter a new name for the service:`,
      default: serviceName
    });

    return await checkForExistingServices(renameService, services);    
  }

  return serviceName;
};

/**
 * Merge two arrays of services and remove duplicates.
 * Duplicates are identified by `id` if present, otherwise by `name`.
 */
export const mergeServices = (arr1: Service[], arr2: Service[]): Service[] => {
  const map = new Map<string, Service>();

  const addService = (svc: Service) => {
    const key = svc.id || svc.name; // prefer id, else name
    if (!map.has(key)) {
      map.set(key, svc);
    }
  };

  arr1.forEach(addService);
  arr2.forEach(addService);

  return [...map.values()];
};


// TODO: Add a single service
export const addSingleService = async (): Promise<void> => {}

// TODO: Update multiple services
export const updateMultipleServices = async (): Promise<void> => {}

// TODO: process all long processors
export const processAllLongProcessors = async (services: Service[]): Promise<Service[]> => {
  // Long Processes are as follows:
  // 1. Database migrations
  // 2. API data seeding
  // 3. File uploads
  // TODO: Refactor to handle more than just the AWS
  const rds = new RDSClient({});
  for (let service of services) {
    // Process each service's long-running tasks
    if (service.type === "db") {
      // Handle database migrations
      const populatedService: Service = await processPostgresDatabaseDataDumpDir(service, rds);
      service = populatedService;
    }
  }

  return services;
}

export const generateDockerCompose = (services: Service[]) => {
  const compose: {
    services: { [key: string]: any };
    version: string;
  } = {
    version: "3.9",
    services: {},
  };

  for (const svc of services) {
    if (svc.type === "api" || svc.type === "web") {
      compose.services[svc.name] = {
        image: svc.image,
        ports: svc.ports || [],
        environment: svc.envVars || {},
      };
    }

    if (svc.type === "db") {
      const base =
        svc.engine === "postgres"
          ? {
              image: `postgres:${svc.version || "15"}`,
              environment: {
                POSTGRES_USER: svc.postgres?.username || "postgres",
                POSTGRES_PASSWORD: svc.postgres?.password || "postgres",
                POSTGRES_DB: svc.postgres?.dbname || "appdb",
              },
              ports: [`${svc.postgres?.port || 5432}:${svc.postgres?.port || 5432}`],
              volumes: [
                `${svc.dataDir}:/var/lib/postgresql/data`,
                `${svc.dumpFile}:/docker-entrypoint-initdb.d/init.sql`,
              ],
            }
          : svc.engine === "mysql"
          ? {
              image: `mysql:${svc.version || "8.0"}`,
              environment: {
                MYSQL_ROOT_PASSWORD: svc.mysql?.password || "root",
                MYSQL_DATABASE: svc.mysql?.dbname || "appdb",
                MYSQL_USER: svc.mysql?.username || "root",
                MYSQL_PASSWORD: svc.mysql?.password || "root",
              },
              ports: [`${svc.mysql?.port || 3306}:${svc.mysql?.port || 3306}`],
              volumes: [
                `${svc.dataDir}:/var/lib/mysql`,
                `${svc.dumpFile}:/docker-entrypoint-initdb.d/init.sql`,
              ],
            }
          : {};

      compose.services[svc.name] = base;
    }
  }

  return compose;
};

export const writeDockerCompose = (services: Service[]) => {
  const compose = generateDockerCompose(services);
  const yaml = YAML.stringify(compose);

  const composePath = path.join(process.cwd(), ".timewarp", "docker-compose.yml");
  fs.writeFileSync(composePath, yaml);

  console.log(`✅ docker-compose.yml written at ${composePath}`);
};
