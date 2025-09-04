import { input } from '@inquirer/prompts';
import { Command } from "@oclif/core";

import { initTimewarpFolder, readConfig, TimewarpConfig, updateConfig } from '../config/index.ts';
import { addMultipleServices, processAllLongProcessors } from '../services/services.ts';

export default class Init extends Command {
  static description = "Initialize Timewarp for your project";

  async run() {
    const { configPath } = initTimewarpFolder();
    this.log(`Using Timewarp config at: ${configPath}`);
    const projectName = await input({
        default: "my-project",
        message: "What is the name of your project?",
        required: true
    });

    const services = await addMultipleServices([]);
    this.log(`Project ${projectName} initialized with ${services.length} services.`);
    updateConfig((config) => ({
      ...config,
      services: [...config.services, ...services]
    }));

    const config: TimewarpConfig = readConfig();
    processAllLongProcessors(config.services);
    console.log("✅ Timewarp initialization complete.");
  }
}