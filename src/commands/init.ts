import { input } from '@inquirer/prompts';
import { Command } from "@oclif/core";

import { initTimewarpFolder, readConfig, TimewarpConfig, updateConfig } from '../config/index.ts';
import { addMultipleServices, processAllLongProcessors, Service, writeDockerCompose } from '../services/services.ts';

export default class Init extends Command {
  static description = "Initialize Timewarp for your project";

  async run() {
    const { configPath } = await initTimewarpFolder();
    this.log(`Using Timewarp config at: ${configPath}`);
    const projectName = await input({
        default: "my-project",
        message: "What is the name of your project?",
        required: true
    });

    let services: Service[] = await addMultipleServices([]);
    this.log(`Project ${projectName} initialized with ${services.length} services.`);

    const config: TimewarpConfig = readConfig();
    services = await processAllLongProcessors(config.services);
    updateConfig((config) => ({
      ...config,
      services: [...config.services, ...services]
    }));

    writeDockerCompose(services);
    console.log("✅ Timewarp initialization complete.");
  }
}