import { select } from "@inquirer/prompts";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { Service } from "../services/services.ts";

export interface TimewarpConfig {
  createdAt: string;
  services: Service[];
  version: number;
}

export const initTimewarpFolder = async () => {
  const cwd = process.cwd();
  const timewarpDir = path.join(cwd, ".timewarp");
  const configPath = path.join(timewarpDir, "config.json");
  const snapshotsDir = path.join(timewarpDir, "snapshots");
  const dataDir = path.join(timewarpDir, "data");

  // Ensure .timewarp root folder
  if (fs.existsSync(timewarpDir)) {
    console.log("ℹ️  .timewarp folder already exists");
    const newTimewarpFolder = await select({
        message: "You have an existing .timewarp folder. What would you like to do?",
        choices: [
            { name: "Create a new folder", value: "create" },
            { name: "Use existing folder", value: "existing" }
        ]
    });

    if (newTimewarpFolder === "create") {
        fs.mkdirSync(timewarpDir, { recursive: true });
        console.log("✅ Created .timewarp folder");
    } else {
        console.log("ℹ️  Using existing .timewarp folder");
    }
  } else {
    fs.mkdirSync(timewarpDir, { recursive: true });
    console.log("✅ Created .timewarp folder");
  }

  // Ensure snapshots folder
  if (fs.existsSync(snapshotsDir)) {
    const newSnapshotsDir = await select({
        message: "Select an existing .timewarp/snapshots folder or create a new one:",
        choices: [
            { name: "Create a new folder", value: "create" },
            { name: "Use existing folder", value: "existing" }
        ]
    });

    if (newSnapshotsDir === "create") {
        fs.mkdirSync(snapshotsDir, { recursive: true });
        console.log("✅ Created .timewarp/snapshots folder");
    } else {
        console.log("ℹ️  Using existing .timewarp/snapshots folder");
    }
  } else {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  // Ensure data folder
  if (fs.existsSync(dataDir)) {
    const newDataDir = await select({
        message: "Select an existing .timewarp/data folder or create a new one:",
        choices: [
            { name: "Create a new folder", value: "create" },
            { name: "Use existing folder", value: "existing" }
        ]
    });

    if (newDataDir === "create") {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log("✅ Created .timewarp/data folder");
    } else {
        console.log("ℹ️  Using existing .timewarp/data folder");
    }
  } else {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✅ Created .timewarp/data folder");
  }

  // Ensure config.json
  if (fs.existsSync(configPath)) {
    const newConfig = await select({
        message: "What would you like to do with the existing config file?",
        choices: [
            { name: "Keep", value: "keep" },
            { name: "Create new one", value: "create" }
        ]
    });

    if (newConfig === "keep") {
        console.log("ℹ️  Keeping config file at .timewarp/config.json");
    } else {
        fs.unlinkSync(configPath);
        const defaultConfig = {
            version: 1,
            createdAt: new Date().toISOString(),
            services: [],
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log("✅ Created default .timewarp/config.json");
    }
  } else {
    const defaultConfig = {
      version: 1,
      createdAt: new Date().toISOString(),
      services: [],
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log("✅ Created default .timewarp/config.json");
  }

  return { timewarpDir, configPath, snapshotsDir, dataDir };
};

const getConfigPath = (): string => {
  const cwd = process.cwd();
  return path.join(cwd, ".timewarp", "config.json");
};

export const readConfig = (): TimewarpConfig => {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error("⚠️ No .timewarp/config.json found. Run `timewarp init` first.");
  }

  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw) as TimewarpConfig;
};

export const updateConfig = (
  updater: (config: TimewarpConfig) => TimewarpConfig
): void => {
  const configPath = getConfigPath();
  const config = readConfig();

  const updated = updater(config);

  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
};

export const generateUniqueServiceId = (): string => {
  const config = readConfig();
  const existingIds = new Set(config.services.map((s: Service) => s.id));

  let newId: string;
  do {
    newId = randomUUID();
  } while (existingIds.has(newId));

  return newId;
};

export const createServiceDataDir = (serviceName: string): string => {
  const dataRoot = path.join(process.cwd(), ".timewarp", "data");
  const dataDir = path.join(dataRoot, serviceName);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  } 

  return dataDir;
};
