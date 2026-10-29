import React from "react";
import { Wallet } from "lucide-react";
import { Button } from "./Button";

interface NavbarProps {
  onConnect: () => void;
  isConnected: boolean;
  address?: string;
}

export function Navbar({ onConnect, isConnected, address }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">NoteVerse</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant={isConnected ? "outline" : "primary"} 
              onClick={onConnect}
              icon={Wallet}
            >
              {isConnected ? (
                <span className="font-mono text-xs">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
