# NoteVerse smart contracts

This repository contains the Solidity contracts and Hardhat scripts for NoteVerse:

- `contracts/UserRegistry.sol` stores user profiles.
- `contracts/StudyMaterial.sol` stores study-material titles, IPFS CIDs, and uploader addresses.

## Requirements

- Node.js 22 LTS (npm is included). The project uses Hardhat **2.28.6**, pinned by `package-lock.json`, and Solidity **0.8.20**.
- Python is **not required**: there are no Python sources or Python dependencies in this repository.
- MetaMask is only needed to use the separate NoteVerse frontend in a browser; it is not needed to compile or run the contracts.

Use the npm version bundled with Node.js and install from the lockfile to get the expected dependency versions.

## Install and compile

From this repository's directory:

```sh
npm ci
npx hardhat compile
```

## Run a local blockchain and deploy

1. In a terminal at this repository's directory, start a local Hardhat node:

   ```sh
   npx hardhat node
   ```

   Keep this terminal running. The node listens at `http://127.0.0.1:8545` and uses chain ID `31337`.

2. In a second terminal at this repository's directory, deploy both contracts to that node:

   ```sh
   npx hardhat run scripts/deploy.js --network localhost
   ```

   The deployment script expects the paired frontend at `../frontend`. It writes the deployed contract addresses and `VITE_EXPECTED_CHAIN_ID=31337` to `../frontend/.env`, preserving an existing `VITE_PINATA_JWT` if present. It replaces the frontend `.env` contents, so re-add any other frontend-specific settings after deploying.

## Run the paired frontend (optional)

The browser application is a separate project in the sibling `frontend` directory; it is not included in this repository. Clone or place that project alongside this repository if you want to run the UI. In the frontend directory, install its dependencies with `npm ci`, then start it with `npm run dev`.

Set up the frontend's ignored `.env` file with the values it needs:

```dotenv
VITE_USER_REGISTRY_ADDRESS=
VITE_STUDY_MATERIAL_ADDRESS=
VITE_EXPECTED_CHAIN_ID=31337
VITE_PINATA_JWT=
```

The deployment command fills in the contract addresses and chain ID. A Pinata JWT is needed for IPFS uploads. `VITE_MATERIAL_ACCESS_RECEIVER` and `VITE_MATERIAL_ACCESS_VALUE_HEX` are optional frontend settings for material-access payments.

Install MetaMask in your browser and add a local network with:

- Network name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

For local testing only, import one of the **test-only** accounts and private keys printed by `npx hardhat node`. Never import a real wallet's private key or use real funds for local development.

## Tests

There is no configured project test command yet: `npm test` currently exits with a placeholder error, and `test/Counter.ts` is a Hardhat sample test for a `Counter` contract that is not present in `contracts/`. Do not treat it as a test suite for the NoteVerse contracts.

## Git and secrets

`.gitignore` excludes dependencies, generated build output, and local `.env` files. Keep API tokens, private keys, and other credentials out of GitHub; if a secret has already been committed, rotate it because adding it to `.gitignore` does not remove it from Git history.
