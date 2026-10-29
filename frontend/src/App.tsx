import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileText,
  ExternalLink,
  BookOpen,
  Clock,
  User,
  Plus,
  AlertCircle,
  Wallet,
  Loader2,
  GraduationCap,
  Archive,
  LogOut,
  ChevronRight,
  ShieldCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import { ethers } from "ethers";
import { uploadToIPFS } from "./lib/ipfs";

const STUDY_MATERIAL_ADDRESS = import.meta.env.VITE_STUDY_MATERIAL_ADDRESS ?? "";
const USER_REGISTRY_ADDRESS = import.meta.env.VITE_USER_REGISTRY_ADDRESS ?? "";
const EXPECTED_CHAIN_ID = BigInt(import.meta.env.VITE_EXPECTED_CHAIN_ID ?? "31337");
const MATERIAL_ACCESS_RECEIVER = import.meta.env.VITE_MATERIAL_ACCESS_RECEIVER ?? "";
const MATERIAL_ACCESS_VALUE_HEX = import.meta.env.VITE_MATERIAL_ACCESS_VALUE_HEX ?? "0x38D7EA4C68000";
const LOCALHOST_RPC_URL = "http://127.0.0.1:8545";

console.log("Study:", STUDY_MATERIAL_ADDRESS);
console.log("Registry:", USER_REGISTRY_ADDRESS);
const STUDY_MATERIAL_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "registryAddress",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "requireRegisteredUploads",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "EmptyCid",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "EmptyTitle",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidRegistryAddress",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "name": "RegistrationRequired",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        }
      ],
      "name": "FileUploaded",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getFile",
      "outputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getFilesCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "resetFiles",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "requireRegisteredUsers",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "resetRegistry",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "cid",
          "type": "string"
        }
      ],
      "name": "uploadFile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "userRegistry",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]as const;

const USER_REGISTRY_ABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "fieldName",
          "type": "string"
        }
      ],
      "name": "InvalidProfileField",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        }
      ],
      "name": "EmailAlreadyRegistered",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "UserAlreadyRegistered",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "email",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "department",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "year",
          "type": "string"
        }
      ],
      "name": "UserRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "userAddress",
          "type": "address"
        }
      ],
      "name": "getUser",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "department",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "year",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isRegistered",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        }
      ],
      "name": "getUserByEmail",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "registeredEmail",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "department",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "year",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isRegistered",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        }
      ],
      "name": "getUserWalletByEmail",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        }
      ],
      "name": "isEmailRegistered",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "email",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "department",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "year",
          "type": "string"
        }
      ],
      "name": "registerUser",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]as const;

const DEPARTMENTS = ["CMPN", "IT", "EXTC", "AI/DS"];
const YEARS = ["2023-27", "2024-28", "2025-29", "2026-30", "2027-31"];
const ALL_DEPARTMENTS = "ALL_DEPARTMENTS";
const ALL_YEARS = "ALL_YEARS";

interface UserAuth {
  name: string;
  email: string;
  department: string;
  year: string;
}

interface Note {
  id: string;
  title: string;
  hash: string;
  uploader: string;
  uploaderName: string;
  uploaderEmail: string;
  date: string;
  timestamp: number;
  type: string;
  department: string;
  year: string;
}

interface Member {
  address: string;
  name: string;
  email: string;
  department: string;
  year: string;
}

interface RegisteredUser extends UserAuth {
  walletAddress: string | null;
}

interface UploadAuthorRecord {
  name: string;
  email: string;
  department: string;
  year: string;
  wallet: string;
}

interface AuthFormProps {
  onAuth: (auth: UserAuth, mode: "LOGIN" | "REGISTER") => Promise<void>;
  isResetting: boolean;
  authError: string | null;
  sessionNotice: string | null;
  clearAuthError: () => void;
  onClearLocalSession: () => Promise<void>;
}

type StudyMaterialContract = ethers.Contract & {
  uploadFile: (title: string, cid: string) => Promise<ethers.ContractTransactionResponse>;
  getFilesCount: () => Promise<bigint>;
  getFile: (index: number) => Promise<any>;
  resetFiles: () => Promise<ethers.ContractTransactionResponse>;
  userRegistry: () => Promise<string>;
  connect: (runner: ethers.ContractRunner) => StudyMaterialContract;
};

type UserRegistryContract = ethers.Contract & {
  registerUser: (
    name: string,
    email: string,
    department: string,
    year: string,
  ) => Promise<ethers.ContractTransactionResponse>;
  getUser: (userAddress: string) => Promise<any>;
  getUserByEmail: (email: string) => Promise<any>;
  getUserWalletByEmail: (email: string) => Promise<string>;
  isEmailRegistered: (email: string) => Promise<boolean>;
  resetRegistry: () => Promise<ethers.ContractTransactionResponse>;
  connect: (runner: ethers.ContractRunner) => UserRegistryContract;
};

const shortenAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

const extractNameFromEmail = (email: string) => {
  const parts = email.split("@")[0].split(".");
  if (parts.length >= 3) {
    const firstName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    const lastName = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
    return `${firstName} ${lastName}`;
  }
  return email.split("@")[0];
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readUserResult = (result: any): UserAuth | null => {
  const name = result?.name ?? result?.[0] ?? "";
  const email = result?.email ?? result?.registeredEmail ?? result?.[1] ?? "";
  const department = result?.department ?? result?.[2] ?? "";
  const year = result?.year ?? result?.[3] ?? "";
  const isRegistered = result?.isRegistered ?? result?.[4] ?? false;

  if (!isRegistered) {
    return null;
  }

  return { name, email, department, year };
};

const localhostResetInterface = new ethers.Interface([
  "function resetFiles()",
  "function resetRegistry()",
]);

const formatError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      code?: number | string;
      data?: string;
      shortMessage?: string;
      reason?: string;
      message?: string | { message?: string } | unknown;
      info?: { error?: { message?: string } };
    };

    if (maybeError.code === 4001 || maybeError.code === "ACTION_REJECTED") {
      return "Request rejected in MetaMask.";
    }

    const normalizedMessage =
      typeof maybeError.message === "string"
        ? maybeError.message
        : typeof maybeError.message === "object" &&
            maybeError.message !== null &&
            "message" in maybeError.message &&
            typeof (maybeError.message as { message?: unknown }).message === "string"
          ? String((maybeError.message as { message?: unknown }).message)
          : undefined;

    if (normalizedMessage?.includes("execution reverted")) {
      return "Transaction reverted. Switch account in MetaMask before connecting, or try again.";
    }

    return (
      maybeError.shortMessage ||
      maybeError.reason ||
      maybeError.info?.error?.message ||
      normalizedMessage ||
      fallback
    );
  }

  return fallback;
};

const REGISTERED_USERS_STORAGE_KEY = "noteverse_registered_users";
const UPLOAD_AUTHORS_STORAGE_KEY = "noteverse_upload_authors";

const readRegisteredUsers = (): RegisteredUser[] => {
  const saved = localStorage.getItem(REGISTERED_USERS_STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as RegisteredUser[];
  } catch {
    return [];
  }
};

const persistRegisteredUsers = (users: RegisteredUser[]) => {
  localStorage.setItem(REGISTERED_USERS_STORAGE_KEY, JSON.stringify(users));
};

const readUploadAuthors = (): Record<string, UploadAuthorRecord> => {
  const saved = localStorage.getItem(UPLOAD_AUTHORS_STORAGE_KEY);
  if (!saved) {
    return {};
  }

  try {
    return JSON.parse(saved) as Record<string, UploadAuthorRecord>;
  } catch {
    return {};
  }
};

const persistUploadAuthors = (authors: Record<string, UploadAuthorRecord>) => {
  localStorage.setItem(UPLOAD_AUTHORS_STORAGE_KEY, JSON.stringify(authors));
};


const Navbar = ({
  onConnect,
  address,
  onLogout,
  user,
  isConnecting,
  networkError,
  sessionNotice,
}: {
  onConnect: (forceSwitch?: boolean) => void;
  address: string | null;
  onLogout: () => void;
  user: UserAuth | null;
  isConnecting: boolean;
  networkError: string | null;
  sessionNotice: string | null;
}) => (
  <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <GraduationCap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">NoteVerse</span>
        </div>

        <div className="flex items-center gap-4">
          {sessionNotice && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              {sessionNotice}
            </div>
          )}

          {networkError && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {networkError}
            </div>
          )}

          {user && (
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {user.department} | {user.year}
                </span>
                <span className="text-xs font-medium text-slate-700">{user.email}</span>
              </div>
              <button onClick={onLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => onConnect(Boolean(address))}
            disabled={isConnecting}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              address
                ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-lg active:scale-95"
            }`}
          >
            {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
            {address ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-mono text-xs">{shortenAddress(address)}</span>
              </div>
            ) : (
              "Connect Wallet"
            )}
          </button>
        </div>
      </div>
    </div>
  </nav>
);

const UsersSidebar = ({
  members,
  selectedMember,
  onSelectMember,
  activeAddress,
}: {
  members: Member[];
  selectedMember: Member | null;
  onSelectMember: (member: Member | null) => void;
  activeAddress: string | null;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] sticky top-24">
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <User className="w-4 h-4 text-indigo-600" /> Network Members
      </h3>
      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full">{members.length}</span>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
      <button
        onClick={() => onSelectMember(null)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
          !selectedMember ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50 border border-transparent"
        }`}
      >
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Global Feed</p>
          <p className="text-[10px] text-slate-400">All registered users</p>
        </div>
      </button>

      <div className="h-px bg-slate-100 my-2 mx-2" />

      {members.map((member) => (
        <button
          key={member.email}
          onClick={() => onSelectMember(member)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
            selectedMember?.email === member.email
              ? "bg-indigo-50 border border-indigo-100"
              : "hover:bg-slate-50 border border-transparent"
          }`}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
              {member.name.charAt(0)}
            </div>
            {activeAddress && member.address && member.address.toLowerCase() === activeAddress.toLowerCase() && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {member.address ? shortenAddress(member.address) : member.email}
            </p>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-300 transition-transform ${
              selectedMember?.email === member.email ? "rotate-90 text-indigo-600" : ""
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

const AuthForm = ({
  onAuth,
  isResetting,
  authError,
  sessionNotice,
  clearAuthError,
  onClearLocalSession,
}: AuthFormProps) => {
  const [step, setStep] = useState<"WELCOME" | "EMAIL" | "OTP" | "PROFILE" | "REGISTERING">("WELCOME");
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("REGISTER");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastUser, setLastUser] = useState<UserAuth | null>(() => {
    const saved = localStorage.getItem("noteverse_last_user");
    return saved ? (JSON.parse(saved) as UserAuth) : null;
  });

  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsSubmitting(false);
      setStep((current) => (current === "REGISTERING" ? "WELCOME" : current));
    }
  }, [authError]);

  const validateEmail = (value: string) => /^\d{4}\.[a-zA-Z]+\.[a-zA-Z]+@ves\.ac\.in$/.test(value);

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearAuthError();

    if (!validateEmail(email)) {
      setError("Format: year.name.surname@ves.ac.in");
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const yearPrefix = normalizedEmail.split(".")[0];
    const matchedYear = YEARS.find((entry) => entry.startsWith(yearPrefix));
    if (matchedYear) {
      setYear(matchedYear);
    }

    if (mode === "LOGIN") {
      await runAuth(
        {
          name: lastUser?.name || extractNameFromEmail(normalizedEmail),
          email: normalizedEmail,
          department: lastUser?.department || DEPARTMENTS[0],
          year: lastUser?.year || YEARS[0],
        },
        "LOGIN",
      );
      return;
    }

    setIsVerifying(true);
    const nextOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(nextOtp);

    setTimeout(() => {
      setIsVerifying(false);
      setStep("OTP");
      setError("");
      alert(`[NoteVerse] Your verification code is: ${nextOtp}`);
    }, 1200);
  };

  const runAuth = async (payload: UserAuth, nextMode: "LOGIN" | "REGISTER") => {
    clearAuthError();
    setError("");
    setStep("REGISTERING");
    setIsSubmitting(true);

    try {
      await onAuth(payload, nextMode);
    } catch (error: unknown) {
      setError(formatError(error, "Authentication failed."));
      setStep(nextMode === "REGISTER" ? "PROFILE" : "WELCOME");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (otp !== generatedOtp) {
      setError('Invalid OTP. Please check your "email" alert.');
      return;
    }

    setError("");
    setStep("PROFILE");
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await runAuth(
      {
        name: extractNameFromEmail(normalizeEmail(email)),
        email: normalizeEmail(email),
        department,
        year,
      },
      "REGISTER",
    );
  };

  const handleClearLocalSession = async () => {
    setError("");

    try {
      await onClearLocalSession();
    } catch (error) {
      setError(formatError(error, "Failed to reset the local demo state."));
      return;
    }

    localStorage.removeItem("noteverse_user");
    localStorage.removeItem("noteverse_last_user");
    sessionStorage.removeItem("noteverse_user");
    sessionStorage.removeItem("noteverse_last_user");
    setLastUser(null);
    setEmail("");
    setOtp("");
    setGeneratedOtp(null);
    setError("");
    clearAuthError();
    setMode("REGISTER");
    setStep("WELCOME");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-indigo-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">NoteVerse Verification</h2>
          <p className="text-slate-500 mt-2">
            {step === "WELCOME" && "Continue with your email to access NoteVerse"}
            {step === "EMAIL" && (mode === "LOGIN" ? "Login with your registered email" : "Enter your college email to begin one-time registration")}
            {step === "OTP" && "Verify your identity before creating your on-chain profile"}
            {step === "PROFILE" && "Complete your student profile"}
            {step === "REGISTERING" && (mode === "REGISTER" ? "Submitting registration transaction..." : "Checking your on-chain profile...")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "WELCOME" && (
            <motion.div
              key="welcome-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {lastUser && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Quick Login</p>
                  <button
                    onClick={() => {
                      clearAuthError();
                      setMode("LOGIN");
                      setEmail(lastUser.email);
                      setError("");
                      setStep("EMAIL");
                    }}
                    disabled={isSubmitting}
                    className="w-full group relative flex items-center gap-4 p-4 bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all text-left shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{lastUser.name}</p>
                      <p className="text-xs text-indigo-100 truncate">{lastUser.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50 ml-auto group-hover:translate-x-1 transition-all" />
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-100" />
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-slate-100" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {
                    clearAuthError();
                    setMode("LOGIN");
                    setEmail(lastUser?.email ?? "");
                    setOtp("");
                    setGeneratedOtp(null);
                    setError("");
                    setStep("EMAIL");
                  }}
                  className="group relative flex items-center gap-4 p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{lastUser ? "Use another account" : "Login"}</p>
                    <p className="text-xs text-slate-500">Direct email login for registered users</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => {
                    clearAuthError();
                    setMode("REGISTER");
                    setEmail("");
                    setOtp("");
                    setGeneratedOtp(null);
                    setStep("EMAIL");
                    setError("");
                  }}
                  className="group relative flex items-center gap-4 p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Register</p>
                    <p className="text-xs text-slate-500">One-time signup with email OTP verification</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => void handleClearLocalSession()}
                  className="w-full mt-4 text-[10px] font-bold text-slate-300 hover:text-red-400 uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {isResetting ? "Resetting Local Demo State..." : "Clear Local Session Data"}
                </button>
              </div>

              {sessionNotice && <p className="text-xs text-center text-emerald-600 font-medium">{sessionNotice}</p>}
              {(error || authError) && <p className="text-xs text-center text-red-500 font-medium">{error || authError}</p>}

              <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">Secured by Ethereum</p>
            </motion.div>
          )}

          {step === "EMAIL" && (
            <motion.form
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={(event) => void handleEmailSubmit(event)}
              className="space-y-5"
            >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">College Email Address</label>
                  <button
                    type="button"
                    onClick={() => setStep("WELCOME")}
                    className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                  >
                    Back
                  </button>
                </div>
                <input
                  type="email"
                  required
                  placeholder="2023.name.surname@ves.ac.in"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    error ? "border-red-500" : "border-slate-200"
                  }`}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    clearAuthError();
                  }}
                />
                {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
              </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {mode === "LOGIN" ? "Login" : isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                </button>
              </motion.form>
            )}

          {step === "OTP" && (
            <motion.form
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={(event) => void handleOtpSubmit(event)}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-center tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    error ? "border-red-500" : "border-slate-200"
                  }`}
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value);
                    setError("");
                  }}
                />
                {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
                <p className="text-[10px] text-slate-400 text-center mt-2">Check your inbox for the code</p>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Verify OTP
              </button>
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
                className="w-full text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
              >
                Change Email
              </button>
            </motion.form>
          )}

          {step === "PROFILE" && (
            <motion.form
              key="profile-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={(event) => void handleProfileSubmit(event)}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                  >
                    {DEPARTMENTS.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Academic Year</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                  >
                    {YEARS.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Complete Setup <ChevronRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          )}

          {step === "REGISTERING" && (
            <motion.div
              key="registering-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-indigo-600" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-slate-900">{mode === "REGISTER" ? "Registering on-chain" : "Loading on-chain profile"}</p>
                <p className="text-sm text-slate-500">
                  {mode === "REGISTER" ? "Waiting for your transaction confirmation..." : "Reading your registry record from the blockchain..."}
                </p>
              </div>

              {error && <p className="text-xs text-center text-red-500 font-medium">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  isUnlocked: boolean;
  isUnlocking: boolean;
  walletConnected: boolean;
  onUnlockView: (note: Note) => void;
}

const NoteCard = ({
  note,
  isUnlocked,
  isUnlocking,
  walletConnected,
  onUnlockView,
}: NoteCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
        <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase">{note.department || "UNKNOWN"}</span>
        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg uppercase">{note.year || "UNREGISTERED"}</span>
      </div>
    </div>

    <h3 className="font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{note.title}</h3>

    <div className="space-y-2.5 mb-5">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <User className="w-3.5 h-3.5" />
        <span className="bg-slate-50 px-1.5 py-0.5 rounded font-semibold">{note.uploaderName}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock className="w-3.5 h-3.5" />
        <span>{note.date}</span>
      </div>
      <div className="text-[10px] font-mono text-slate-400 truncate">CID: {note.hash}</div>
    </div>

    <div className="space-y-3">
      <p className="text-xs text-slate-500">Access requires a small ETH payment</p>
      {!walletConnected && <p className="text-xs font-medium text-amber-600">Connect Wallet to continue</p>}
      <button
        type="button"
        onClick={() => onUnlockView(note)}
        disabled={isUnlocking}
        className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl font-bold border border-slate-200 bg-transparent hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-sm group-hover:shadow-lg group-hover:shadow-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isUnlocking ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4 mr-2" />
        )}
        {isUnlocking ? "Waiting for payment..." : isUnlocked ? "Open Material" : "Unlock & View"}
      </button>
    </div>
  </motion.div>
);

export default function App() {
  const [user, setUser] = useState<UserAuth | null>(() => {
    const saved = localStorage.getItem("noteverse_user");
    return saved ? (JSON.parse(saved) as UserAuth) : null;
  });
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => readRegisteredUsers());
  const [uploadAuthors, setUploadAuthors] = useState<Record<string, UploadAuthorRecord>>(() => readUploadAuthors());
  const [notes, setNotes] = useState<Note[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState(ALL_DEPARTMENTS);
  const [yearFilter, setYearFilter] = useState(ALL_YEARS);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [authViewKey, setAuthViewKey] = useState(0);
  const [unlockedNotes, setUnlockedNotes] = useState<Record<string, boolean>>({});
  const [unlockingNoteId, setUnlockingNoteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

const contractsConfigured = Boolean(
  STUDY_MATERIAL_ADDRESS && USER_REGISTRY_ADDRESS
);

  const validateContracts = async (
    provider: ethers.BrowserProvider,
    registry: UserRegistryContract,
    material: StudyMaterialContract,
  ) => {
    const [registryCode, materialCode] = await Promise.all([
      provider.getCode(USER_REGISTRY_ADDRESS),
      provider.getCode(STUDY_MATERIAL_ADDRESS),
    ]);

    if (registryCode === "0x") {
      throw new Error(
        `No contract found at VITE_USER_REGISTRY_ADDRESS (${USER_REGISTRY_ADDRESS}). Redeploy the contracts and restart the frontend.`,
      );
    }

    if (materialCode === "0x") {
      throw new Error(
        `No contract found at VITE_STUDY_MATERIAL_ADDRESS (${STUDY_MATERIAL_ADDRESS}). Redeploy the contracts and restart the frontend.`,
      );
    }

    try {
      await registry.getUser(USER_REGISTRY_ADDRESS);
    } catch {
      throw new Error(
        `The address ${USER_REGISTRY_ADDRESS} is not a UserRegistry contract on chain ${EXPECTED_CHAIN_ID.toString()}. Redeploy the contracts and restart the frontend.`,
      );
    }

    try {
      const linkedRegistry = await material.userRegistry();
      if (linkedRegistry.toLowerCase() !== USER_REGISTRY_ADDRESS.toLowerCase()) {
        throw new Error(
          `StudyMaterial points to ${linkedRegistry}, but the frontend is using ${USER_REGISTRY_ADDRESS}. Redeploy the contracts so the frontend and contracts use the same registry address.`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `The address ${STUDY_MATERIAL_ADDRESS} is not a StudyMaterial contract on chain ${EXPECTED_CHAIN_ID.toString()}. Redeploy the contracts and restart the frontend.`,
      );
    }
  };

  const getBrowserProvider = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is required to use NoteVerse.");
    }

    return new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
  };

  const getReadOnlyProvider = () => new ethers.JsonRpcProvider(LOCALHOST_RPC_URL);

  const getContracts = (runner: ethers.BrowserProvider | ethers.JsonRpcProvider | ethers.JsonRpcSigner) => {
    const registry = new ethers.Contract(USER_REGISTRY_ADDRESS, USER_REGISTRY_ABI, runner) as UserRegistryContract;
    const material = new ethers.Contract(STUDY_MATERIAL_ADDRESS, STUDY_MATERIAL_ABI, runner) as StudyMaterialContract;
    return { registry, material };
  };

  const getReadContracts = () => getContracts(getReadOnlyProvider());

  const resetAppState = (options?: { preserveWallet?: boolean }) => {
    const preserveWallet = options?.preserveWallet ?? false;
    setUser(null);
    if (!preserveWallet) {
      setAddress(null);
    }
    setNotes([]);
    setUploadTitle("");
    setSelectedFile(null);
    setUploadedFileUrl(null);
    setSelectedMember(null);
    setAuthError(null);
    setAppError(null);
    setNetworkError(null);
    setUnlockedNotes({});
    setUnlockingNoteId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const upsertRegisteredUser = (nextUser: RegisteredUser) => {
    setRegisteredUsers((current) => {
      const existingIndex = current.findIndex((entry) => normalizeEmail(entry.email) === normalizeEmail(nextUser.email));
      const next = [...current];

      if (existingIndex >= 0) {
        next[existingIndex] = {
          ...next[existingIndex],
          ...nextUser,
        };
      } else {
        next.push(nextUser);
      }

      persistRegisteredUsers(next);
      return next;
    });
  };

  const linkWalletToRegisteredUser = (email: string, walletAddress: string) => {
    setRegisteredUsers((current) => {
      const next = current.map((entry) =>
        normalizeEmail(entry.email) === normalizeEmail(email)
          ? {
              ...entry,
              walletAddress,
            }
          : entry,
      );
      persistRegisteredUsers(next);
      return next;
    });
  };

  const rememberUploadAuthor = (cid: string, author: UploadAuthorRecord) => {
    setUploadAuthors((current) => {
      const next = {
        ...current,
        [cid]: author,
      };
      persistUploadAuthors(next);
      return next;
    });
  };

  const clearSession = async () => {
    setIsResetting(true);
    setAuthError(null);
    setAppError(null);

    try {
      if (EXPECTED_CHAIN_ID === 31337n && contractsConfigured) {
        const rpcRequest = async <T,>(method: string, params: unknown[] = []): Promise<T> => {
          const response = await fetch(LOCALHOST_RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: `${method}-${Date.now()}`,
              method,
              params,
            }),
          });

          const payload = (await response.json()) as { result?: T; error?: { message?: string } };
          if (!response.ok || payload.error) {
            throw new Error(payload.error?.message || `Local RPC ${method} failed.`);
          }

          return payload.result as T;
        };

        const localhostAccounts = await rpcRequest<string[]>("eth_accounts");
        const resetSender = localhostAccounts[0];

        if (!resetSender) {
          throw new Error("No unlocked localhost account was found for resetting the demo state.");
        }

        const sendLocalReset = async (to: string, data: string) => {
          const txHash = await rpcRequest<string>("eth_sendTransaction", [
            {
              from: resetSender,
              to,
              data,
            },
          ]);

          let receipt: { status?: string } | null = null;
          for (let attempt = 0; attempt < 20; attempt += 1) {
            receipt = await rpcRequest<{ status?: string } | null>("eth_getTransactionReceipt", [txHash]);
            if (receipt) {
              break;
            }

            await new Promise((resolve) => window.setTimeout(resolve, 250));
          }

          if (!receipt || receipt.status !== "0x1") {
            throw new Error("Local reset transaction failed.");
          }
        };

        await sendLocalReset(
          STUDY_MATERIAL_ADDRESS,
          localhostResetInterface.encodeFunctionData("resetFiles"),
        );
        await sendLocalReset(
          USER_REGISTRY_ADDRESS,
          localhostResetInterface.encodeFunctionData("resetRegistry"),
        );
      }

      localStorage.clear();
      sessionStorage.clear();
      setRegisteredUsers([]);
      setUploadAuthors({});
      resetAppState();
      setAuthViewKey((current) => current + 1);
      setSessionNotice("Session cleared successfully. Local demo data was reset.");
    } finally {
      setIsResetting(false);
    }
  };

  const getCurrentWallet = async () => {
    const provider = getBrowserProvider();
    const isCorrectNetwork = await checkNetwork(provider);
    if (!isCorrectNetwork) {
      throw new Error("Wrong network. Please switch MetaMask to Localhost 31337.");
    }

    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const currentWallet = window.ethereum?.selectedAddress ?? accounts[0] ?? signerAddress;

    if (!currentWallet) {
      throw new Error("No MetaMask account selected.");
    }

    console.log("Current wallet address:", currentWallet);
    console.log("Current signer address:", signerAddress);

    return {
      provider,
      signer,
      currentWallet,
    };
  };

  const isWalletConnected = () => Boolean(address);

  const requireWalletGuard = () => {
    if (!isWalletConnected()) {
      const message = "Please connect your wallet to continue.";
      setAppError(message);
      throw new Error(message);
    }
  };

  const getCurrentSigner = async () => {
    const { provider, signer, currentWallet } = await getCurrentWallet();

    return {
      provider,
      signer,
      currentAccount: currentWallet,
      ...getContracts(signer),
    };
  };

  const openMaterial = (note: Note) => {
    window.open(`https://ipfs.io/ipfs/${note.hash}`, "_blank", "noopener,noreferrer");
  };

  const checkNetwork = async (browserProvider: ethers.BrowserProvider) => {
    const network = await browserProvider.getNetwork();
    if (network.chainId === EXPECTED_CHAIN_ID) {
      setNetworkError(null);
      return true;
    }

    const message = "Wrong network. Please switch MetaMask to Localhost 31337.";
    setNetworkError(message);
    alert(message);
    return false;
  };

const loadUserProfile = async (
  walletAddress: string,
  registryInstance?: UserRegistryContract
): Promise<UserAuth | null> => {
  const contract = registryInstance;

  if (!contract) {
    return null;
  }

  try {
    const rawProfile = await contract.getUser(walletAddress);
    return readUserResult(rawProfile);
  } catch {
    return null;
  }
};

const loadUserProfileByEmail = async (
  email: string,
  registryInstance?: UserRegistryContract
): Promise<UserAuth | null> => {
  const contract = registryInstance;

  if (!contract) {
    return null;
  }

  try {
    const rawProfile = await contract.getUserByEmail(normalizeEmail(email));
    return readUserResult(rawProfile);
  } catch {
    return null;
  }
};

  const hydrateWalletSession = async (browserProvider: ethers.BrowserProvider, shouldRequestAccounts: boolean) => {
    if (!contractsConfigured) {
      throw new Error("Missing VITE_STUDY_MATERIAL_ADDRESS or VITE_USER_REGISTRY_ADDRESS.");
    }

    const isCorrectNetwork = await checkNetwork(browserProvider);
    if (!isCorrectNetwork) return null;

    const accounts = await browserProvider.send(shouldRequestAccounts ? "eth_requestAccounts" : "eth_accounts", []);
    const selectedAccount = window.ethereum?.selectedAddress ?? accounts[0];
    if (!selectedAccount) {
      setAddress(null);
      setUser(null);
      return null;
    }
    setAddress(selectedAccount);

    const { registry, material } = getContracts(browserProvider);
    await validateContracts(browserProvider, registry, material);

    return {
      address: selectedAccount,
      registry,
    };
  };

  const connectWallet = async (forceSwitch = false) => {
    setIsConnecting(true);
    setAppError(null);
    setSessionNotice(null);

    try {
      if (!user) {
        throw new Error("Login first, then connect your wallet.");
      }

      if (!window.ethereum) {
        throw new Error("MetaMask is required to use NoteVerse.");
      }

      const previousAddress = address;

      if (forceSwitch) {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }

      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const browserProvider = getBrowserProvider();
      console.log("Connecting wallet...");
      const session = await hydrateWalletSession(browserProvider, false);
      if (session?.address) {
        linkWalletToRegisteredUser(user.email, session.address);
        console.log("Connected wallet address:", session.address);
        const changedWallet =
          previousAddress && previousAddress.toLowerCase() !== session.address.toLowerCase();
        setSessionNotice(
          changedWallet
            ? `Wallet changed to ${shortenAddress(session.address)}.`
            : `Connected wallet ${shortenAddress(session.address)}.`,
        );
      }
    } catch (error) {
      const message = formatError(error, "Wallet connection failed.");
      setAppError(message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const uploadAndStore = async (file: File) => {
    if (!uploadTitle || !user) {
      return;
    }
    requireWalletGuard();
    await ensureWalletLinkedProfile();
    const { currentAccount, material } = await getCurrentSigner();

    console.log("Uploading file to Pinata...");
    const fileUrl = await uploadToIPFS(file);
    const cid = fileUrl.split("/").pop();
    if (!cid) {
      throw new Error("Invalid IPFS URL returned by Pinata.");
    }

    console.log("Storing file on localhost...");
    console.log("Sending transaction from:", currentAccount);
    const tx = await material.uploadFile(uploadTitle, cid);
    console.log("Transaction submitted:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed.");

    rememberUploadAuthor(cid, {
      name: user.name,
      email: user.email,
      department: user.department,
      year: user.year,
      wallet: currentAccount,
    });

    return fileUrl;
  };

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    setAppError(null);

    try {
      const provider = getBrowserProvider();
      const { material } = getContracts(provider);
      const count = Number(await material.getFilesCount());
      const fileCalls = Array.from({ length: count }, (_, index) => material.getFile(index));
      const fileResults = await Promise.all(fileCalls);

      const fetchedNotes = fileResults.map((file: any, index: number) => {
        const title = file.title ?? file[0];
        const hash = file.ipfsHash ?? file[1];
        const uploader = file.uploader ?? file[2];
        const recordedAuthor = uploadAuthors[String(hash)] ?? null;
        const fallbackLabel = shortenAddress(String(uploader));
        const authorName =
          recordedAuthor?.name?.trim() ||
          recordedAuthor?.email?.trim() ||
          fallbackLabel;
        const authorEmail = recordedAuthor?.email?.trim() || "";

        return {
          id: index.toString(),
          title,
          hash,
          uploader,
          uploaderName: authorName,
          uploaderEmail: authorEmail,
          date: `On-chain record #${index + 1}`,
          timestamp: count - index,
          type: "IPFS",
          department: recordedAuthor?.department ?? "",
          year: recordedAuthor?.year ?? "",
        } satisfies Note;
      });

      setNotes(fetchedNotes.reverse());
    } catch (error) {
      setAppError(formatError(error, "Failed to fetch study materials."));
      setNotes([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask accountsChanged:", accounts);
      if (!accounts.length) {
        setAddress(null);
        setNotes([]);
        setSelectedFile(null);
        setUploadedFileUrl(null);
        setSelectedMember(null);
        setAppError(null);
        setNetworkError(null);
        setUnlockedNotes({});
        setUnlockingNoteId(null);
        setSessionNotice("Wallet disconnected. Connect again to continue.");
        return;
      }

      const nextAccount = window.ethereum?.selectedAddress ?? accounts[0];
      if (user) {
        linkWalletToRegisteredUser(user.email, nextAccount);
      }
      setAddress(nextAccount);
      setAppError(null);
      setNetworkError(null);
      setUnlockedNotes({});
      setUnlockingNoteId(null);
      setSessionNotice(`Wallet changed to ${shortenAddress(nextAccount)}.`);
    };

    const handleChainChanged = () => {
      resetAppState();
      setAuthViewKey((current) => current + 1);
      setSessionNotice("Network changed. Reconnect on Localhost 31337.");
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [address, contractsConfigured, user]);

  useEffect(() => {
    if (!contractsConfigured || !address) {
      setNotes([]);
      return;
    }
    void fetchFiles();
  }, [contractsConfigured, address, uploadAuthors]);

  const ensureWalletLinkedProfile = async () => {
    requireWalletGuard();

    if (!user) {
      throw new Error("Please log in to continue.");
    }

    const { currentAccount } = await getCurrentSigner();
    linkWalletToRegisteredUser(user.email, currentAccount);
    return currentAccount;
  };

  const loginUser = async (auth: UserAuth) => {
    const existingProfile = registeredUsers.find((entry) => normalizeEmail(entry.email) === normalizeEmail(auth.email));
    if (!existingProfile) {
      throw new Error("User not found.");
    }

    setUser(existingProfile);
    localStorage.setItem("noteverse_user", JSON.stringify(existingProfile));
    localStorage.setItem("noteverse_last_user", JSON.stringify(existingProfile));
    setSessionNotice(`Signed in as ${existingProfile.email}. Connect your wallet to continue.`);
  };

  const logoutUser = () => {
    setUser(null);
    setAuthError(null);
    setAppError(null);
    setSelectedFile(null);
    setSelectedMember(null);
    setUploadedFileUrl(null);
    setNotes([]);
    setUploadTitle("");
    localStorage.removeItem("noteverse_user");
    localStorage.removeItem("noteverse_last_user");
    sessionStorage.removeItem("noteverse_user");
    setAuthViewKey((current) => current + 1);
    setSessionNotice(address ? `Logged out. Connected wallet: ${shortenAddress(address)}` : "Logged out successfully.");
  };

  const handleAuth = async (auth: UserAuth, mode: "LOGIN" | "REGISTER") => {
    setAuthError(null);
    setAppError(null);

    if (mode === "LOGIN") {
      await loginUser(auth);
      return;
    }

    const existing = registeredUsers.find((entry) => normalizeEmail(entry.email) === normalizeEmail(auth.email));
    if (existing) {
      throw new Error("This email is already registered. Use Login instead.");
    }

    setUser(auth);
    localStorage.setItem("noteverse_user", JSON.stringify(auth));
    localStorage.setItem("noteverse_last_user", JSON.stringify(auth));
    upsertRegisteredUser({
      ...auth,
      walletAddress: null,
    });
    setSessionNotice("Registration complete. Connect your wallet to continue.");
  };

  const handleLogout = () => {
    logoutUser();
  };

  const handleUpload = async () => {
    if (!uploadTitle || !selectedFile || !user) return;

    setIsUploading(true);
    setAppError(null);
    setUploadedFileUrl(null);

    try {
      const fileUrl = await uploadAndStore(selectedFile);
      if (!fileUrl) {
        return;
      }
      setUploadedFileUrl(fileUrl);
      setUploadTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchFiles();
      alert("Successfully uploaded to IPFS and stored the metadata on-chain.");
    } catch (error) {
      setAppError(formatError(error, "Upload failed."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUnlockAndView = async (note: Note) => {
    if (unlockedNotes[note.id]) {
      openMaterial(note);
      return;
    }

    setAppError(null);
    setSessionNotice(null);

    if (!isWalletConnected() || !window.ethereum) {
      setAppError("Connect Wallet to unlock this material.");
      return;
    }

    if (!MATERIAL_ACCESS_RECEIVER) {
      setAppError("Set VITE_MATERIAL_ACCESS_RECEIVER in frontend/.env to accept access payments.");
      return;
    }

    setUnlockingNoteId(note.id);

    try {
      const { provider, currentAccount } = await getCurrentSigner();
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: MATERIAL_ACCESS_RECEIVER,
            value: MATERIAL_ACCESS_VALUE_HEX,
          },
        ],
      });

      const receipt = await provider.waitForTransaction(txHash);
      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed");
      }

      setUnlockedNotes((current) => ({
        ...current,
        [note.id]: true,
      }));
      setSessionNotice("Payment confirmed. Material unlocked.");
      openMaterial(note);
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: number | string }).code
          : undefined;

      if (errorCode === 4001 || errorCode === "ACTION_REJECTED") {
        setAppError("Transaction cancelled");
        return;
      }

      setAppError("Transaction failed");
    } finally {
      setUnlockingNoteId(null);
    }
  };

  const sortedNotes = useMemo(() => [...notes].sort((left, right) => right.timestamp - left.timestamp), [notes]);

  const filteredNotes = useMemo(
    () =>
      sortedNotes.filter((note) => {
        const matchesDepartment = departmentFilter === ALL_DEPARTMENTS || note.department === departmentFilter;
        const matchesYear = yearFilter === ALL_YEARS || note.year === yearFilter;
        return matchesDepartment && matchesYear;
      }),
    [departmentFilter, sortedNotes, yearFilter],
  );

  const currentNotes = useMemo(() => {
    if (!user) return [];
    return sortedNotes.filter((note) => note.department === user.department && note.year === user.year);
  }, [sortedNotes, user]);

  const archivedNotes = useMemo(() => {
    if (!user) return filteredNotes;
    return filteredNotes.filter((note) => note.department !== user.department || note.year !== user.year);
  }, [filteredNotes, user]);

  const members = useMemo(() => {
    const memberMap = new Map<string, Member>();

    registeredUsers.forEach((registeredUser) => {
      memberMap.set(normalizeEmail(registeredUser.email), {
        address: registeredUser.walletAddress ?? "",
        name: registeredUser.name,
        email: registeredUser.email,
        department: registeredUser.department,
        year: registeredUser.year,
      });
    });

    if (address && user) {
      memberMap.set(normalizeEmail(user.email), {
        address,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
      });
    }

    notes.forEach((note) => {
      const key = note.uploaderEmail ? normalizeEmail(note.uploaderEmail) : note.uploader.toLowerCase();
      if (!memberMap.has(key)) {
        memberMap.set(key, {
          address: note.uploader,
          name: note.uploaderName,
          email: note.uploaderEmail,
          department: note.department,
          year: note.year,
        });
      }
    });

    return Array.from(memberMap.values());
  }, [address, notes, registeredUsers, user]);

  const selectedFilePreviewUrl = useMemo(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
      }
    };
  }, [selectedFilePreviewUrl]);

  if (!user) {
    return (
      <AuthForm
        key={authViewKey}
        onAuth={handleAuth}
        isResetting={isResetting}
        authError={authError ?? appError}
        sessionNotice={sessionNotice}
        clearAuthError={() => {
          setAuthError(null);
          setAppError(null);
        }}
        onClearLocalSession={clearSession}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar
        address={address}
        onConnect={(forceSwitch) => void connectWallet(forceSwitch)}
        onLogout={handleLogout}
        user={user}
        isConnecting={isConnecting}
        networkError={networkError}
        sessionNotice={sessionNotice}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <UsersSidebar
              members={members}
              selectedMember={selectedMember}
              onSelectMember={setSelectedMember}
              activeAddress={address}
            />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-indigo-600">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5" /> Share Material
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Material Title</label>
                  <input
                    type="text"
                    placeholder="e.g. OS Lab Manual TE IT"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={uploadTitle}
                    onChange={(event) => setUploadTitle(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">File</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      selectedFile ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(event) => {
                        if (event.target.files?.[0]) {
                          setSelectedFile(event.target.files[0]);
                        }
                      }}
                    />
                    <div className={`p-4 rounded-2xl mb-3 ${selectedFile ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 text-center break-all">
                      {selectedFile ? selectedFile.name : "Select Document"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX up to 20MB</p>
                  </div>
                </div>

                {selectedFilePreviewUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview</p>
                    <img
                      src={selectedFilePreviewUrl}
                      alt="Selected upload preview"
                      className="w-full rounded-2xl border border-slate-200 object-cover max-h-48"
                    />
                  </div>
                )}

                <button
                  className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={!uploadTitle || !selectedFile || !address || isUploading}
                  onClick={() => void handleUpload()}
                >
                  {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isUploading ? "Uploading to IPFS..." : "Publish to Blockchain"}
                </button>

                {appError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4" /> {appError}
                  </div>
                )}

                {uploadedFileUrl && (
                  <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Upload Complete</p>
                    <a
                      href={uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-xs font-medium text-emerald-700 hover:underline"
                    >
                      {uploadedFileUrl}
                    </a>
                  </div>
                )}

                {!address && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4" /> Connect wallet to publish
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedMember ? `${selectedMember.name}'s Profile` : "Study Feed"}</h2>
              <p className="text-sm text-slate-500">
                {selectedMember
                  ? `Viewing materials shared by ${selectedMember.name}`
                  : `Recommended notes are limited to ${user.department} ${user.year}.`}
              </p>
            </div>

            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Syncing with Ethereum...</p>
              </div>
            ) : (
              <div className="space-y-12">
                {selectedMember ? (
                  <section>
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-lg shadow-indigo-100">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold">
                          {selectedMember.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                          <p className="text-indigo-100 text-sm">{selectedMember.email || shortenAddress(selectedMember.address)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase opacity-60">Department</p>
                          <p className="text-sm font-bold">{selectedMember.department || "Unknown"}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase opacity-60">Batch</p>
                          <p className="text-sm font-bold">{selectedMember.year || "Unknown"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sortedNotes
                        .filter((note) =>
                          note.uploaderEmail
                            ? normalizeEmail(note.uploaderEmail) === normalizeEmail(selectedMember.email)
                            : note.uploader.toLowerCase() === selectedMember.address.toLowerCase(),
                        )
                        .map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            isUnlocked={Boolean(unlockedNotes[note.id])}
                            isUnlocking={unlockingNoteId === note.id}
                            walletConnected={Boolean(address)}
                            onUnlockView={handleUnlockAndView}
                          />
                        ))}
                    </div>
                  </section>
                ) : (
                  <>
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-slate-200" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Recommended for You</h3>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                      <p className="text-xs text-slate-500 text-center mb-6">Showing only notes for {user.department} {user.year}.</p>

                      {currentNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <AnimatePresence mode="popLayout">
                            {currentNotes.map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                isUnlocked={Boolean(unlockedNotes[note.id])}
                                isUnlocking={unlockingNoteId === note.id}
                                walletConnected={Boolean(address)}
                                onUnlockView={handleUnlockAndView}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">No materials found for your department and year yet.</p>
                        </div>
                      )}
                    </section>

                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-slate-200" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2">
                          <Archive className="w-3 h-3" /> Other Materials
                        </h3>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      {archivedNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <AnimatePresence mode="popLayout">
                            {archivedNotes.map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                isUnlocked={Boolean(unlockedNotes[note.id])}
                                isUnlocking={unlockingNoteId === note.id}
                                walletConnected={Boolean(address)}
                                onUnlockView={handleUnlockAndView}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                          <p className="text-slate-400 text-sm">No other materials match the selected department and year filters.</p>
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-12 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-slate-400 w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">NoteVerse</span>
          </div>
          <p className="text-xs text-slate-400">&copy; 2026 NoteVerse Platform. Decentralized Education Infrastructure.</p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }

  interface ImportMetaEnv {
    readonly VITE_STUDY_MATERIAL_ADDRESS?: string;
    readonly VITE_USER_REGISTRY_ADDRESS?: string;
    readonly VITE_PINATA_JWT?: string;
    readonly VITE_EXPECTED_CHAIN_ID?: string;
    readonly VITE_MATERIAL_ACCESS_RECEIVER?: string;
    readonly VITE_MATERIAL_ACCESS_VALUE_HEX?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
