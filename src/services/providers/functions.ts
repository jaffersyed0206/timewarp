/* eslint-disable camelcase */
import { input, select } from "@inquirer/prompts";

import { createPostgresService } from "../databases/index.ts";
import { Service } from "../services.ts";
import { createAWS_ECRService } from "./aws/index.ts";

export const retrieveDockerImage = async (name: string, type: {label: string, value: "api" | "web"}): Promise<Service> => {
  if (type.value !== "web" && type.value !== "api") throw new Error("Invalid service type");
  const providerImageSource = await select({
    message: `Where is your ${type.label} image stored?`,
    choices: [
      { name: "Docker Hub", value: "dockerhub" },
      { name: "AWS ECR", value: "aws-ecr" },
      { name: "GitHub Container Registry", value: "ghcr" },
      { name: "Local Dockerfile", value: "local" },
    ],
  });

  let service = {} as Service;

  switch (providerImageSource) {
    case "aws-ecr": {
      // Handle AWS ECR case authentication
      service = await createAWS_ECRService(name, type.value);
      break;
    }

    case "dockerhub": {
      // Handle Docker Hub case
      break;
    }

    case "ghcr": {
      // Handle GitHub Container Registry case
      break;
    }

    case "local": {
      // Handle Local Dockerfile case
      break;
    }

    default: {
      break;
    }
  }

  return service
}

export const retrieveDatabaseInstance = async(): Promise<Service> => {
  const databaseType = await select({
    message: "Which database do you want to onboard?",
    choices: [
      { name: "PostgreSQL", value: "postgres" },
      { name: "MySQL", value: "mysql" },
      { name: "MongoDB", value: "mongodb" },
      { name: "SQLite", value: "sqlite" },
      { name: "Redis", value: "redis" }
    ]
  });

  const databaseInstanceName = await input({
    message: `What is the name of the ${databaseType} database instance?`,
    default: `my-${databaseType}-db`
  });

  const provider = await select({
    message: "Which cloud provider do you want to fetch databases from?",
    choices: [
      { name: "Amazon Web Services (AWS)", value: "aws" },
      { name: "Google Cloud Platform (GCP)", value: "gcp" },
      { name: "Microsoft Azure", value: "azure" },
      { name: "Oracle Cloud Infrastructure (OCI)", value: "oci" },
      { name: "IBM Cloud", value: "ibm" },
      { name: "Other / On-Prem", value: "other" },
    ],
  });

  let service = {} as Service;
  
  switch (databaseType) {
    case "mongodb": {
      // Handle MongoDB specific logic
      break;
    }

    case "mysql": {
      // Handle MySQL specific logic
      break;
    }

    case "postgres": {
      // Handle PostgreSQL specific logic
      const { finished, service: createdService } = await createPostgresService(databaseInstanceName, provider);
      if (finished) {
        service = createdService
      }

      break;
    }

    case "redis": {
      // Handle Redis specific logic
      break;
    }

    case "sqlite": {
      // Handle SQLite specific logic
      break;
    }

    default: {
      break;
    }
  }

  return service;
}