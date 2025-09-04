import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { input } from "@inquirer/prompts"
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
// eslint-disable-next-line unicorn/import-style
import * as path from "node:path";

export const validateAwsCredentials = async (): Promise<boolean> => {
  try {
    const client = new STSClient({});
    const command = new GetCallerIdentityCommand({});
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

export const isAwsConfigured = async (): Promise<boolean> => {
  const awsDir = path.join(os.homedir(), ".aws");
  const credFile = path.join(awsDir, "credentials");

  // Step 1: check if file exists
  if (!fs.existsSync(credFile)) {
    return false;
  }

  // Step 2: check if [default] profile exists
  const creds = fs.readFileSync(credFile, "utf8");
  if (!/\[default\]/.test(creds)) {
    return false;
  }

  const validAwsCredentials = await validateAwsCredentials();
  return validAwsCredentials;
}

export const awsAuthentication = async () => {
  const awsAccessKeyId = await input({ message: "Enter your AWS Access Key ID" });
  const awsSecretAccessKey = await input({ message: "Enter your AWS Secret Access Key" });
  const awsRegion = await input({ message: "Enter your default AWS region", default: "us-east-1" });

  return new Promise<void>((resolve, reject) => {
    // spawn `aws configure`
    const proc = spawn("aws", ["configure"], { stdio: "pipe" });

    // feed in values as if user typed them
    proc.stdin.write(`${awsAccessKeyId}\n`);
    proc.stdin.write(`${awsSecretAccessKey}\n`);
    proc.stdin.write(`${awsRegion}\n`);
    proc.stdin.write(`json\n`); // output format
    proc.stdin.end();

    proc.on("close", (code) => {
      if (code === 0) {
        console.log("✅ AWS configured successfully");
        resolve();
      } else {
        reject(new Error(`aws configure failed with exit code ${code}`));
      }
    });
  });
};