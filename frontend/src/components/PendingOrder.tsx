import type { Cart } from "../types";

interface Props {
  cart: Cart;
  onCancel: () => void;
  cancelling: boolean;
}

export default function PendingOrder({ cart, onCancel, cancelling }: Props) {
  if (cart.status !== "AWAITING_BUYER_APPROVAL") return null;

  const item = cart.items[0];

  return (
    <div className="pending-order">
      <div className="pending-header">
        <span className="pending-icon">⏳</span>
        <span>Awaiting PayPal Approval</span>
      </div>
      <div className="pending-body">
        {item && (
          <div className="pending-item">
            <span className="item-name">{item.name}</span>
            <span className="item-qty">× {item.quantity}</span>
            <span className="item-price">${cart.totalAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="pending-actions">
          <a
            href={cart.paypalApproveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Approve in PayPal ↗
          </a>
          <button
            className="btn btn-danger"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
        <p className="pending-hint">
          Open the PayPal link, approve as the sandbox buyer, then return here.
        </p>
      </div>
    </div>
  );
}

