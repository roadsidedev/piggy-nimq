import { useVault } from "./useVault";
import { BalanceCard } from "@/components/vault/BalanceCard";
import { YieldPanel } from "@/components/vault/YieldToggle";
import { DepositModal } from "@/components/vault/DepositModal";
import { WithdrawModal } from "@/components/vault/WithdrawModal";
import { TransactionHistory } from "@/components/vault/TransactionHistory";
import { Button } from "@/components/common";

export function VaultPage() {
  const {
    balance,
    yieldEnabled,
    yieldAmount,
    apy,
    earnings,
    vaultAge,
    transactions,
    depositModalOpen,
    withdrawModalOpen,
    txStatus,
    deposit,
    withdraw,
    confirmYield,
    disableYield,
    openDepositModal,
    closeDepositModal,
    openWithdrawModal,
    closeWithdrawModal,
  } = useVault();

  return (
    <div className="flex flex-col gap-4">
      <BalanceCard
        balance={balance}
        yieldAmount={yieldAmount}
        earnings={earnings}
        apy={apy}
        yieldEnabled={yieldEnabled}
      />

      <div className="flex gap-3">
        <Button onClick={openDepositModal} className="flex-1">
          Deposit
        </Button>
        <Button
          onClick={openWithdrawModal}
          variant="secondary"
          className="flex-1"
        >
          Withdraw
        </Button>
      </div>

      <YieldPanel
        yieldEnabled={yieldEnabled}
        yieldAmount={yieldAmount}
        balance={balance}
        apy={apy}
        earnings={earnings}
        txStatus={txStatus}
        onConfirm={confirmYield}
        onAdjust={() => {}}
        onDisable={disableYield}
      />

      {vaultAge > 0 ? (
        <p className="text-center text-xs text-neutral-500">
          Vault age: {vaultAge} days
        </p>
      ) : null}

      <TransactionHistory transactions={transactions} />

      <DepositModal
        open={depositModalOpen}
        onClose={closeDepositModal}
        onDeposit={deposit}
      />
      <WithdrawModal
        open={withdrawModalOpen}
        onClose={closeWithdrawModal}
        onWithdraw={withdraw}
        maxBalance={balance}
        yieldAmount={yieldAmount}
      />
    </div>
  );
}
