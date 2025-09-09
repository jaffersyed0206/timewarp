 
import { RDSClient } from "@aws-sdk/client-rds";
import { password as promptPassword } from "@inquirer/prompts";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { createServiceDataDir } from "../../../../../config/index.ts";
import { Service } from "../../../../services.ts";
import { getRDSInstanceData, RDSInstance, restoreDBInstanceFromSnapshot, verifyRDSConnection } from "../index.ts";

export const dumpAWSRDSPostgresDatabase = async (service: Service, rds: RDSClient): Promise<Service> => {
    // Implementation for dumping a Postgres database
    if (!service.tempInstanceId || !service.snapshotId) {
        throw new Error("tempInstanceId and snapshotId must be defined");
    }

    const instancePassword = await promptPassword({
        message: `Enter the password for the database user ${service.name}:`,
    });

    const currentInstance: RDSInstance = await getRDSInstanceData(service.tempInstanceId, rds);

    const { connection, password } = await verifyRDSConnection({
        database: currentInstance.dbname,
        username: currentInstance.username,
        password: instancePassword,
        host: currentInstance.endpoint,
        ssl: { rejectUnauthorized: false },
        port: currentInstance.port,
    });

    if (!connection) {
        // Here the connection is going to fail so we should handle it
        throw new Error("Failed to connect to the RDS instance");
    }

    await restoreDBInstanceFromSnapshot(service.tempInstanceId, service.snapshotId, rds);

    // Implementation for dumping the current instance
    const dumpFile: string = await exportPostgresSnapshot(
        currentInstance.endpoint,
        currentInstance.port,
        currentInstance.username,
        currentInstance.dbname,
        service.snapshotId,
        password
    );

    const dataDir: string = createServiceDataDir(service.name);

    return {
        ...service,
        dumpFile,
        dataDir
    }
};

export const exportPostgresSnapshot = async (
  endpoint: string,
  port: number,
  username: string,
  dbname: string,
  snapshotId: string,
  password: string
): Promise<string> => {
  const snapshotDir = path.join(process.cwd(), ".timewarp", "snapshots");
  const dumpFile = path.join(snapshotDir, `${snapshotId}.sql`);

  // Ensure snapshots directory exists
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  // Build pg_dump command
  const cmd = `pg_dump -h ${endpoint} -p ${port} -U ${username} -d ${dbname} -F p > "${dumpFile}"`;

  console.log(`➡️ Running: ${cmd}`);

  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        env: {
          ...process.env, // keep system PATH etc.
          PGPASSWORD: password, // inject password securely
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ pg_dump failed:", stderr || error.message);
          return reject(error);
        }

        console.log("✅ pg_dump completed");
        resolve(dumpFile);
      }
    );
  });
};