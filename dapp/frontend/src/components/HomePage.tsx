import React from "react";
import WithdrawSide from "./WithdrawSide";
import DepositSide from "./DepositSide";
const HomePage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6  mx-auto w-full mt-24">
      <WithdrawSide />
      <DepositSide />
    </div>
  );
};

export default HomePage;
