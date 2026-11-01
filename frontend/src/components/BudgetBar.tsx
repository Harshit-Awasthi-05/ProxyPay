import type { WalletState } from "../types";

interface Props {
  wallet: WalletState;
}

export default function BudgetBar({ wallet }: Props) {
  const { totalBudgetCap, totalSpent, totalReserved, remainingBudget } = wallet;
  const spentPct = (totalSpent / totalBudgetCap) * 100;
  const reservedPct = (totalReserved / totalBudgetCap) * 100;

  return (
    <div className="budget-bar">
      <div className="budget-header">
        <span className="budget-title">Budget</span>
        <span className="budget-remaining">
          <strong>${remainingBudget.toFixed(2)}</strong> remaining of ${totalBudgetCap.toFixed(2)}
        </span>
      </div>
      <div className="budget-track">
        {spentPct > 0 && (
          <div
            className="budget-segment spent"
            style={{ width: `${spentPct}%` }}
            title={`Spent: $${totalSpent.toFixed(2)}`}
          />
        )}
        {reservedPct > 0 && (
          <div
            className="budget-segment reserved"
            style={{ width: `${reservedPct}%` }}
            title={`Reserved: $${totalReserved.toFixed(2)}`}
          />
        )}
      </div>
      <div className="budget-legend">
        <span className="legend-item">
          <span className="legend-dot spent" /> Spent ${totalSpent.toFixed(2)}
        </span>
        <span className="legend-item">
          <span className="legend-dot reserved" /> Reserved ${totalReserved.toFixed(2)}
        </span>
        <span className="legend-item">
          <span className="legend-dot remaining" /> Available ${remainingBudget.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

