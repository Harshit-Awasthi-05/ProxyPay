import { useSearchParams, useNavigate } from "react-router-dom";

export default function CancelPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("token");

  return (
    <div className="return-page">
      <div className="return-card">
        <div className="return-icon">🚫</div>
        <h1>Payment Cancelled</h1>
        <p>You cancelled the PayPal approval. No funds were charged.</p>
        {orderId && (
          <p className="return-detail">
            Order ID: <code>{orderId}</code>
          </p>
        )}
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          ← Back to ProxyPay
        </button>
      </div>
    </div>
  );
}

