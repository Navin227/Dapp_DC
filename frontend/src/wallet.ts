import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask install kar");
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    return {
      address: accounts[0],
      provider,
      signer,
    };
  } catch (error) {
    console.error("Connection error:", error);
    return null;
  }
}

export async function checkWalletConnection() {
  if (!window.ethereum) return null;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_accounts", []);

  if (accounts.length === 0) return null;

  const signer = await provider.getSigner();

  return {
    address: accounts[0],
    provider,
    signer,
  };
}