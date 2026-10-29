import axios from "axios";

const PINATA_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";

type PinataUploadResponse = {
  IpfsHash?: string;
};

export async function uploadToIPFS(file: File): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT?.trim();

  if (!jwt) {
    throw new Error("Missing VITE_PINATA_JWT in the frontend environment.");
  }

  if (jwt === "your_pinata_jwt") {
    throw new Error("VITE_PINATA_JWT still contains the placeholder value. Replace it with your real Pinata JWT and restart the frontend.");
  }

  if (/\s/.test(jwt)) {
    throw new Error("VITE_PINATA_JWT contains whitespace and is malformed. Copy the full Pinata JWT again on a single line, then restart the frontend.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: file.name,
    }),
  );

  try {
    const response = await axios.post<PinataUploadResponse>(PINATA_FILE_ENDPOINT, formData, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const ipfsHash = response.data?.IpfsHash;
    if (!ipfsHash) {
      throw new Error("Pinata did not return an IPFS hash.");
    }

    return `${PINATA_GATEWAY_BASE_URL}/${ipfsHash}`;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data
            ? JSON.stringify(error.response.data)
            : "";

      const message =
        error.response?.data && typeof error.response.data === "object" && "error" in error.response.data
          ? String(error.response.data.error)
          : responseData || error.message;

      throw new Error(`Pinata upload failed (${error.response?.status ?? "network"}): ${message || "Unknown error"}`);
    }

    throw error;
  }
}
