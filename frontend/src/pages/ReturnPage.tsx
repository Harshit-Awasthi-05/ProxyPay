import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { approveOrder } from "../api";

type Status = "loading" | "success" | "error";

export default function ReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState("");
  const [captureId, setCaptureId] = useState("");
  const [remainingBudget, setRemainingBudget] = useState<number | null>(null);

  const orderId = params.get("token");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setDetail("Missing PayPal order token in the URL.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await approveOrder(orderId, "capture");

        if (cancelled) return;

        if (data.status === "PAID") {
          setStatus("success");
          setCaptureId(data.captureId ?? "");
          setRemainingBudget(data.remainingBudget ?? null);
          setDetail("Payment captured successfully!");
        } else {
          setStatus("error");
          setDetail(data.error ?? `Order status: ${data.status}`);
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setDetail(err.message ?? "Failed to capture payment.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="return-page">
      <div className="return-card">
        {status === "loading" && (
          <>
            <div className="return-icon">⏳</div>
            <h1>Capturing Payment…</h1>
            <p>Please wait while we finalize your order.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="return-icon success">✅</div>
            <h1>Payment Complete</h1>
            <p>{detail}</p>
            {captureId && (
              <p className="return-detail">
                Capture ID: <code>{captureId}</code>
              </p>
            )}
            {remainingBudget !== null && (
              <p className="return-detail">
                Remaining budget: <strong>${remainingBudget.toFixed(2)}</strong>
              </p>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <div className="return-icon error">❌</div>
            <h1>Payment Failed</h1>
            <p className="error-text">{detail}</p>
          </>
        )}

        <button className="btn btn-primary" onClick={() => navigate("/")}>
          ← Back to ProxyPay
        </button>
      </div>
    </div>
  );
}

