import { exec } from "child_process";
import { IS_VERCEL_ENV, IS_DOCKER_ENV } from "lib/const";
import { promisify } from "util";
import "load-env";
const execPromise = promisify(exec);

async function runCommand(command: string, description: string) {
  console.log(`Starting: ${description}`);
  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
      env: process.env,
    });

    console.log(`${description} output:`);
    console.log(stdout);

    if (stderr) {
      console.error(`${description} stderr:`);
      console.error(stderr);
    }
    console.log(`${description} finished successfully.`);
  } catch (error: any) {
    console.error(`${description} error:`, error);
    process.exit(1);
  }
}

async function main() {
  if (IS_VERCEL_ENV) {
    console.log("Running on Vercel, performing database migration.");
    await runCommand("pnpm db:migrate", "Database migration");
    await runCommand("pnpm db:push", "Pushing database schema");
  } else if (IS_DOCKER_ENV) {
    console.log("Running in Docker, nothing to do.");
  } else {
    console.log(
      "Running in a normal environment, performing initial environment setup.",
    );
    await runCommand("pnpm initial:env", "Initial environment setup");
  }
}

main();
