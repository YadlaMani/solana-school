import React from "react";
import { WalletButton } from "./wallet-button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm m-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Locker Dapp</h1>
        <WalletButton />
      </div>
    </header>
  );
};

export default Header;
