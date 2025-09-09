/* eslint-disable camelcase */
import { DBInstance, RDSClient } from "@aws-sdk/client-rds";
import { input, select } from "@inquirer/prompts";

import { generateUniqueServiceId } from "../../../config/index.ts";
import { Service } from "../../services.ts";
import { listEcrImagesForRepo, listECRRepos } from "./ecr/index.ts";
import { awsAuthentication, isAwsConfigured } from "./iam/auth.ts";
import { getAwsRegion } from "./iam/index.ts";
import { listRDSInstance, pickRDSSnapshot } from "./rds/index.ts";

export const createAWS_ECRService = async (serviceName: string, type: string) => {
    let service = {} as Service
    const awsConfigured: boolean = await isAwsConfigured();
    if (!awsConfigured) {
        await awsAuthentication();
    }

    const region = getAwsRegion();
    // List the available images in the AWS ECR repository
    const ecrRepos = await listECRRepos();
    const ecrRepoSelect = await select({
        message: "Select an ECR repository",
        choices: ecrRepos.map((repo) => ({ name: repo, value: repo })),
    });

    const selectedRepo = ecrRepoSelect;
    const ecrImages = await listEcrImagesForRepo(selectedRepo, region);
    const selectedImage = await select({
        message: "Select an ECR image",
        choices: ecrImages,
    });

    const portMapping = await input({
        message: "Enter port mapping (host:container)",
        default: type === "api" ? "3000:3000" : "8080:8080",
    });

    await input({
        message: "Enter environment variables (key=value), comma-separated",
        default: "NODE_ENV=production",
        transformer(input) {
            const envVars: Record<string, string> = {};
            for (const varDef of input.split(",")) {
                const [key, value] = varDef.split("=");
                envVars[key] = value;
            }

            service.envVars = envVars;
            return input;
        }
    });

    service = {
        id: generateUniqueServiceId(),
        image: selectedImage,
        name: serviceName,
        ports: [portMapping],
        type: "api",
        envVars: service.envVars,
        provider: "aws",
    };

    return service;
}

export const createAWS_RDSService = async (name: string, db_engine: "mariadb" | "mysql" | "oracle" | "postgres" | "sqlserver"): Promise<{
    finished: boolean,
    service: Service
}> => {
    // Implement RDS service creation logic here
    // You can use the dbInstance information to configure the service
    const rds: RDSClient = new RDSClient({ region: "us-east-1" });

    const awsConfigured: boolean = await isAwsConfigured();
    if (!awsConfigured) {
        await awsAuthentication();
    }

    const DBInstances: DBInstance[] = await listRDSInstance();

    const engineDatabases: DBInstance[] = DBInstances.filter((db) => db.Engine === db_engine);

    const instance = await select({
        message: "Which RDS instance do you want to pull from?",
        choices: engineDatabases.map((db) => ({
            name: `${db.DBInstanceIdentifier} (Postgres ${db.EngineVersion}, ${db.AvailabilityZone})`,
            value: JSON.stringify({
                dbInstanceIdentifier: db.DBInstanceIdentifier,
                engine: db.Engine,
                engineVersion: db.EngineVersion,
                availabilityZone: db.AvailabilityZone,
                endpoint: db.Endpoint,
                username: db.MasterUsername
            }),
        })),
    });

    const instanceData = JSON.parse(instance);

    const snapshot = await pickRDSSnapshot(instanceData.dbInstanceIdentifier, rds);
    if (snapshot.exit) {
        return {
            finished: false,
            service: {} as Service
        };
    }

    const tempInstanceId = await input({
        message: `What is the name of the ${name} temporary instance?`,
        default: `timewarp-temp-${Date.now()}`
    });

    return {
        finished: true,
        service: {
            id: generateUniqueServiceId(),
            name,
            type: "db",
            provider: "aws",
            snapshotId: snapshot.snapshotId,
            tempInstanceId,
            engine: db_engine,
            version: instanceData.engineVersion,
        }
    }
};