import { useState } from "react";
import { useBorrow } from "./useBorrow";
import { RiskSimulator } from "./RiskSimulator";
import { Card, CardTitle, CardValue, Button, Input } from "@/components/common";

export function BorrowPage() {
  const {
    availableBorrow,
    borrowedAmount,
    healthFactor,
    liquidationThreshold,
    borrowApy,
    monthlyInterest,
    txStatus,
    txError,
    simulatedBorrow,
    simulatedHealthFactor,
    riskLevel,
    setSimulatedBorrow,
    borrow,
    repay,
  } = useBorrow();

  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");

  const handleBorrow = async () => {
    if (!borrowAmount || Number(borrowAmount) <= 0) return;
    try {
      await borrow(borrowAmount);
      setBorrowAmount("");
    } catch {
      // error is in txError from store
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || Number(repayAmount) <= 0) return;
    try {
      await repay(repayAmount);
      setRepayAmount("");
    } catch {
      // error is in txError from store
    }
  };

  const txInProgress = txStatus === "pending" || txStatus === "confirming";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle>Available to Borrow</CardTitle>
        <CardValue>${availableBorrow}</CardValue>
      </Card>

      <Card>
        <CardTitle>Current Loan</CardTitle>
        <CardValue>${borrowedAmount}</CardValue>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-500">Health Factor</span>
          <span className={healthFactor > 1.5 ? "text-sage-600" : "text-red-500"}>
            {healthFactor > 99 ? "99+" : healthFactor.toFixed(2)}
          </span>
        </div>
      </Card>

      {txError ? (
        <p className="text-sm text-red-500">{txError}</p>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Borrow</h3>
        <div className="flex flex-col gap-3">
          <Input
            type="number"
            placeholder="Amount (USDT)"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
          />
          <Button onClick={handleBorrow} loading={txInProgress} size="lg">
            {txStatus === "confirming" ? "Confirming..." : "Borrow"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Repay</h3>
        {Number(borrowedAmount) <= 0 ? (
          <p className="text-sm text-gray-500">No outstanding debt.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              type="number"
              placeholder="Amount (USDT)"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
            />
            <Button onClick={handleRepay} loading={txInProgress} variant="secondary" size="lg">
              {txStatus === "confirming" ? "Confirming..." : "Repay"}
            </Button>
          </div>
        )}
      </div>

      <RiskSimulator
        availableBorrow={availableBorrow}
        borrowedAmount={borrowedAmount}
        healthFactor={healthFactor}
        liquidationThreshold={liquidationThreshold}
        borrowApy={borrowApy}
        monthlyInterest={monthlyInterest}
        simulatedBorrow={simulatedBorrow}
        simulatedHealthFactor={simulatedHealthFactor}
        riskLevel={riskLevel}
        onSimulateChange={setSimulatedBorrow}
      />
    </div>
  );
}
