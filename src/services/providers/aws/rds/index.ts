/* eslint-disable no-return-await */
/* eslint-disable complexity */
/* eslint-disable no-promise-executor-return */
/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable n/no-process-exit */
/* eslint-disable n/no-extraneous-import */
import { CreateDBSnapshotCommand, DBInstance, DeleteDBInstanceCommand, DescribeDBInstancesCommand, DescribeDBSnapshotsCommand, RDSClient, RestoreDBInstanceFromDBSnapshotCommand } from "@aws-sdk/client-rds";
import { input, password, select } from "@inquirer/prompts";
import chalk from "chalk";
import { Client } from "pg";


export interface RDSInstance {
  availabilityZone: string;
  dbInstanceIdentifier: string;
  dbname: string;
  endpoint: string;
  engine: string;
  engineVersion: string;
  port: number;
  username: string;
}

export const listRDSInstance = async (): Promise<DBInstance[]> => {
  try {
    const rds = new RDSClient({ region: "us-east-1" });
    const { DBInstances } = await rds.send(new DescribeDBInstancesCommand({}));

    if (!DBInstances || DBInstances.length === 0) {
      console.error(
        chalk.red("❌ No RDS instances found in this account/region.\n") +
        chalk.yellow("👉 Check that:\n") +
        "- You are using the right AWS account & region\n" +
        "- Your IAM user has rds:DescribeDBInstances permission\n" +
        "- There are RDS Postgres instances running"
      );
      process.exit(1);
    }

    return DBInstances;
  } catch (error: any) {
    console.error(chalk.red("❌ Failed to list RDS instances:"), error.message || error);
    process.exit(1);
  }
};

export const getRDSInstanceData = async (instanceId: string, rds: RDSClient): Promise<RDSInstance> => {
    const { DBInstances } = await rds.send(
        new DescribeDBInstancesCommand({
            DBInstanceIdentifier: instanceId,
        })
    );

    if (!DBInstances || DBInstances.length === 0) {
        throw new Error(`RDS instance ${instanceId} not found`);
    }

    for (const dbInstance of DBInstances) {
        // Do something with each DB instance
        if (dbInstance.DBInstanceIdentifier === instanceId) {

            const validEndpoint: boolean = dbInstance.Endpoint !== undefined;
            const validAvailabilityZone: boolean = dbInstance.AvailabilityZone !== undefined;
            const validEngine: boolean = dbInstance.Engine !== undefined;
            const validEngineVersion: boolean = dbInstance.EngineVersion !== undefined;
            const validUsername: boolean = dbInstance.MasterUsername !== undefined;
            const validDBInstanceIdentifier: boolean = dbInstance.DBInstanceIdentifier !== undefined;
            const validPort: boolean = dbInstance.Endpoint?.Port !== undefined;
            const validDBName: boolean = dbInstance.DBName !== undefined;

            if (!validEndpoint || !validAvailabilityZone || !validEngine || !validEngineVersion || !validUsername || !validDBInstanceIdentifier || !validPort || !validDBName) {
                throw new Error(`RDS instance ${instanceId} is missing required properties`);
            }

            const endpoint: string = dbInstance.Endpoint?.Address ?? "";
            const availabilityZone: string = dbInstance.AvailabilityZone ?? "";
            const engine: string = dbInstance.Engine ?? "";
            const engineVersion: string = dbInstance.EngineVersion ?? "";
            const username: string = dbInstance.MasterUsername ?? "";
            const dbInstanceIdentifier: string = dbInstance.DBInstanceIdentifier ?? "";
            const dbname: string = dbInstance.DBName ?? "";

            return {
                endpoint,
                availabilityZone,
                engine,
                engineVersion,
                username,
                dbInstanceIdentifier,
                port: dbInstance.Endpoint?.Port ?? 0,
                dbname
            };
        }
    }

    throw new Error(`RDS instance ${instanceId} not found`);
};

export const pickRDSSnapshot = async (instanceId: string, rds: RDSClient): Promise<{
    exit: boolean,
    snapshotId: string
}> => {
    const { DBSnapshots } = await rds.send(
        new DescribeDBSnapshotsCommand({
            DBInstanceIdentifier: instanceId,
        })
    );

    let snapshotId: string = ""
    if (!DBSnapshots || DBSnapshots.length === 0) {
        const emptySnapshot = await select({
            message: `No snapshots found for ${instanceId}. Do you want to create one?`,
            choices: [
                { name: "Yes", value: "yes" },
                { name: "No", value: "no" }
            ]
        });

        if (emptySnapshot === "yes") {
           snapshotId = await createAWS_RDSSnapshot(instanceId, rds);
        } else {
            return { exit: true, snapshotId: "" };
        }
    } else {
        snapshotId = await select({
            message: `Which snapshot of ${instanceId} do you want?`,
            choices: DBSnapshots.map((snap) => ({
                name: `${snap.DBSnapshotIdentifier} (created ${snap.SnapshotCreateTime})`,
                value: snap.DBSnapshotIdentifier!,
            })),
            default: ""
        });
    }

    return { exit: false, snapshotId };
}

const createAWS_RDSSnapshot = async (instanceId: string, rds: RDSClient): Promise<string> => {
    const defaultSnapshotId = `timewarp-snap-${Date.now()}`;
    const snapshotId = await input({
        message: `Enter a name for the new snapshot (default: ${defaultSnapshotId}):`,
        default: defaultSnapshotId
    });

    await rds.send(
        new CreateDBSnapshotCommand({
            DBInstanceIdentifier: instanceId,
            DBSnapshotIdentifier: snapshotId,
        })
    );

    console.log(`⏳ Creating snapshot ${snapshotId}...`);

    // Step 4: Wait until snapshot is ready
    let available = false;
    while (!available) {
        const { DBSnapshots: snaps } = await rds.send(
            new DescribeDBSnapshotsCommand({
                DBInstanceIdentifier: instanceId,
                DBSnapshotIdentifier: snapshotId,
            })
        );

        if (snaps && snaps[0].Status === "available") {
            available = true;
        } else {    
            await new Promise((r) => setTimeout(r, 15000)); // wait 15s
        }
    }

    return snapshotId;
};

/*
 in here the instanceId will be the string of the temp instance that you want to create and the
 snapshotId will be the string of the snapshot that you want to restore from
*/
export const restoreDBInstanceFromSnapshot = async (instanceId: string, snapshotId: string, rds: RDSClient): Promise<void> => {
    await rds.send(
        new RestoreDBInstanceFromDBSnapshotCommand({
            DBInstanceIdentifier: instanceId,
            DBSnapshotIdentifier: snapshotId,
            DBInstanceClass: "db.t3.micro", // smallest instance type
            Engine: "postgres", // assuming Postgres, adjust as needed
            PubliclyAccessible: true, // make it publicly accessible
        })
    );

    console.log(`⏳ Restoring DB instance ${instanceId} from snapshot ${snapshotId}...`);

    // Step 4: Wait until instance is available
    let available = false;
    while (!available) {
        const { DBInstances } = await rds.send(
            new DescribeDBInstancesCommand({
                DBInstanceIdentifier: instanceId,
            })
        );

        if (DBInstances && DBInstances[0].DBInstanceStatus === "available") {
            available = true;
        } else {
            await new Promise((r) => setTimeout(r, 15000)); // wait 15s
        }
    }

    console.log(`✅ DB instance ${instanceId} restored from snapshot ${snapshotId}.`);
};

export const deleteDBInstance = async (instanceId: string, rds: RDSClient): Promise<void> => {
    await rds.send(
        new DeleteDBInstanceCommand({
            DBInstanceIdentifier: instanceId,
            SkipFinalSnapshot: true, // Skip final snapshot for deletion
        })
    );

    console.log(`✅ DB instance ${instanceId} deleted.`);
};

export const connectToRDSValid = async (instanceParams: {
    database: string,
    host: string,
    password: string
    port: number,
    ssl: { rejectUnauthorized: false }, // often required for RDS
    username: string,
}): Promise<boolean> => {
    const client = new Client({
        host: instanceParams.host,
        port: instanceParams.port,
        database: instanceParams.database,
        user: instanceParams.username,
        password: instanceParams.password,
        ssl: { rejectUnauthorized: false }, // often required for RDS
    });
    try {
        await client.connect();
        console.log("✅ Connection successful!");
        await client.end();

        // you could save to .timewarp/config.json here
        return true;
    } catch (error: any) {
        console.error("❌ Connection failed:", error.message);
        return false;
    }
}

export const verifyRDSConnection = async (instanceParams: {
    database: string,
    host: string,
    password: string
    port: number,
    ssl: { rejectUnauthorized: false }, // often required for RDS
    username: string,
}): Promise<{
    connection: boolean,
    password: string
}> => {
    const verifiedRDSInstance = await connectToRDSValid(instanceParams);
    if (!verifiedRDSInstance) {
        const retryInstanceConnection = await select({
            message: "❌ RDS connection verification failed. Would you like to retry?",
            choices: [
                { name: "Yes", value: "yes" },
                { name: "No", value: "no" }
            ]
        });

        if (retryInstanceConnection === "yes") {
            const newPassword = await password({
                message: "Enter the correct password:",
            })
            return await verifyRDSConnection({
                ...instanceParams,
                password: newPassword
            });
        }
 
        return {
            connection: false,
            password: instanceParams.password
        };
    }

    return {
        connection: true,
        password: instanceParams.password
    }
}