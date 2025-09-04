/* eslint-disable unicorn/no-process-exit */
/* eslint-disable perfectionist/sort-interfaces */
/* eslint-disable n/no-process-exit */
import { DescribeImagesCommand, DescribeRepositoriesCommand, ECRClient } from "@aws-sdk/client-ecr";
// eslint-disable-next-line n/no-extraneous-import
import chalk from "chalk";

interface EcrImageMeta {
  registryId: string;
  repositoryName: string;
  imageTags?: string[];
}

export const listECRRepos = async (): Promise<string[]> => {
  try {
    const ecr = new ECRClient({});
    const command = new DescribeRepositoriesCommand({});
    const response = await ecr.send(command);

    if (!response.repositories || response.repositories.length === 0) {
      console.log(chalk.yellow("⚠️ No ECR repositories found in this account/region."));
      return [];
    }

    return response.repositories.map((repo) => repo.repositoryName!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.name === "AccessDeniedException") {
      console.error(
        chalk.red("❌ Access denied: ") +
          `Your AWS user/role is not authorized to call ${chalk.cyan("ecr:DescribeRepositories")}.\n\n` +
          `👉 Fix: Attach the policy ${chalk.green("AmazonEC2ContainerRegistryReadOnly")} or a custom policy with that action.`
      );
    } else if (error.$metadata?.httpStatusCode === 403) {
      console.error(chalk.red("❌ Forbidden: Invalid AWS credentials or missing permissions."));
    } else if (error.$metadata?.httpStatusCode === 400) {
      console.error(chalk.red("❌ Bad request: ") + "Check your AWS region or account setup.");
    } else {
      console.error(chalk.red("❌ Unexpected AWS error:"), error.message || error);
    }

    // Exit cleanly
    process.exit(1);
  }
};

export const listEcrImagesForRepo = async (
  repoName: string,
  region: string
): Promise<{
    name: string;
    value: string;
}[]> => {
  const ecr = new ECRClient({ region });

  const { imageDetails } = await ecr.send(
    new DescribeImagesCommand({
      repositoryName: repoName,
    })
  );

  // Flatten and collect tags
  const choices = (imageDetails || []).flatMap((img) => {
    const tags = img.imageTags || [];
    const pushed = img.imagePushedAt?.toISOString().slice(0, 16).replace("T", " ");
    const sizeMb = img.imageSizeInBytes
      ? (img.imageSizeInBytes / (1024 * 1024)).toFixed(1)
      : "?";

    if (!img.registryId || !img.repositoryName) {
      console.error(chalk.red("❌ Missing image metadata: "), img);
      process.exit(1);
    }

    return tags.map((tag: string) => ({
      name: `${tag} — ${pushed || "unknown date"} — ${sizeMb} MB`,
      value: buildEcrImageUri({
        registryId: img.registryId as string,
        repositoryName: img.repositoryName as string,
        imageTags: [tag],
      }, region),
    }));
  });

  return choices;
};

export const buildEcrImageUri = (meta: EcrImageMeta, region: string): string => {
  if (!meta.imageTags || meta.imageTags.length === 0) {
    throw new Error("No image tags available");
  }

  const tag = meta.imageTags[0]; // default to first tag
  return `${meta.registryId}.dkr.ecr.${region}.amazonaws.com/${meta.repositoryName}:${tag}`;
}
