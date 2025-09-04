import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { Service } from "../services/services.ts";

export interface TimewarpConfig {
  createdAt: string;
  services: Service[];
  version: number;
}

export const initTimewarpFolder = () => {
  const cwd = process.cwd();
  const timewarpDir = path.join(cwd, ".timewarp");
  const configPath = path.join(timewarpDir, "config.json");

  // Ensure .timewarp folder exists
  if (fs.existsSync(timewarpDir)) {
    console.log("ℹ️  .timewarp folder already exists");
  } else {
    fs.mkdirSync(timewarpDir, { recursive: true });
    console.log("✅ Created .timewarp folder");
  }

  // Ensure config.json exists
  if (fs.existsSync(configPath)) {
    console.log("ℹ️  Config file already exists at .timewarp/config.json");
  } else {
    const defaultConfig = {
      version: 1,
      createdAt: new Date().toISOString(),
      services: []
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log("✅ Created default .timewarp/config.json");
  }

  return { timewarpDir, configPath };
}

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