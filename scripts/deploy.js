import hre from "hardhat";
import fs from "node:fs/promises";
import path from "node:path";

const FRONTEND_ENV_PATH = path.resolve(process.cwd(), "..", "frontend", ".env");

async function updateFrontendEnv(registryAddress, studyMaterialAddress) {
  let existingJwt = "your_pinata_jwt";

  try {
    const existingEnv = await fs.readFile(FRONTEND_ENV_PATH, "utf8");
    const jwtLine = existingEnv
      .split(/\r?\n/)
      .find((line) => line.startsWith("VITE_PINATA_JWT="));

    if (jwtLine) {
      existingJwt = jwtLine.slice("VITE_PINATA_JWT=".length);
    }
  } catch {
    // Ignore missing env file and fall back to the placeholder.
  }

  const nextEnv = [
    `VITE_USER_REGISTRY_ADDRESS=${registryAddress}`,
    `VITE_STUDY_MATERIAL_ADDRESS=${studyMaterialAddress}`,
    `VITE_PINATA_JWT=${existingJwt}`,
    "VITE_EXPECTED_CHAIN_ID=31337",
    "",
  ].join("\n");

  await fs.writeFile(FRONTEND_ENV_PATH, nextEnv, "utf8");
  console.log("Frontend .env updated:", FRONTEND_ENV_PATH);
}

async function main() {
  try {
    const { ethers, network } = hre;
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const deployerBalance = await ethers.provider.getBalance(deployerAddress);

    console.log(`Deploying contracts to ${network.name}...`);
    console.log("Deployer:", deployerAddress);
    console.log("Balance:", ethers.formatEther(deployerBalance), "ETH");

    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    const registry = await UserRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("UserRegistry deployed to:", registryAddress);

    const StudyMaterial = await ethers.getContractFactory("StudyMaterial");
    const studyMaterial = await StudyMaterial.deploy(registryAddress, false);
    await studyMaterial.waitForDeployment();
    const studyMaterialAddress = await studyMaterial.getAddress();
    console.log("StudyMaterial deployed to:", studyMaterialAddress);

    await updateFrontendEnv(registryAddress, studyMaterialAddress);
  } catch (error) {
    console.error("Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

await main();
