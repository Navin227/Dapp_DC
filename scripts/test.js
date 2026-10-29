import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("Starting test...");

  // provider
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // signer (first account)
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // replace if needed
  const wallet = new ethers.Wallet(privateKey, provider);

  // read ABI
  const file = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/StudyMaterial.sol/StudyMaterial.json"
    )
  );

  const abi = file.abi;

  const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const contract = new ethers.Contract(address, abi, wallet);

  console.log("Contract connected");

  // store data
  const tx = await contract.uploadFile("DBMS Notes", "Qm123abc");
  await tx.wait();

  console.log("Stored data");

  // read data
  const count = await contract.getFilesCount();
  console.log("Count:", count.toString());

  const fileData = await contract.getFile(0);
  console.log("File:", fileData);
}

main();