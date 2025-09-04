 
import ini from "ini";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const getAwsRegion = (profile = "default"): string => {
  const configPath = path.join(os.homedir(), ".aws", "config");
  if (!fs.existsSync(configPath)) throw new Error("AWS config file not found");

  const config = ini.parse(fs.readFileSync(configPath, "utf8"));
  return config[`profile ${profile}`]?.region || config[profile]?.region || null;
}
