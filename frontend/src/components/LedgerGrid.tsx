import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import type { LedgerEntry } from "../types";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  entries: LedgerEntry[];
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PAID:             { bg: "#dcfce7", fg: "#166534" },
  ALLOWED:          { bg: "#dcfce7", fg: "#166534" },
  BLOCKED:          { bg: "#fee2e2", fg: "#991b1b" },
  FAILED:           { bg: "#fee2e2", fg: "#991b1b" },
  PENDING_APPROVAL: { bg: "#fef3c7", fg: "#92400e" },
  INFO:             { bg: "#e0e7ff", fg: "#3730a3" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatAmount(params: { value?: number }): string {
  return params.value != null ? `$${params.value.toFixed(2)}` : "";
}

export default function LedgerGrid({ entries }: Props) {
  const columnDefs = useMemo<ColDef<LedgerEntry>[]>(
    () => [
      {
        headerName: "Time",
        field: "timestamp",
        width: 100,
        valueFormatter: (p) => (p.value ? formatTime(p.value) : ""),
        sort: "desc",
      },
      { headerName: "Actor", field: "actor", width: 130 },
      { headerName: "Action", field: "action", width: 190 },
      {
        headerName: "Status",
        field: "status",
        width: 140,
        filter: true,
        cellStyle: (p) => {
          const colors = STATUS_COLORS[p.value ?? ""] ?? {};
          return colors.bg
            ? {
                backgroundColor: colors.bg,
                color: colors.fg,
                fontWeight: 600,
                borderRadius: "4px",
                textAlign: "center",
              }
            : undefined;
        },
      },
      { headerName: "Item", field: "productName", width: 200 },
      {
        headerName: "Amount",
        field: "amount",
        width: 100,
        valueFormatter: formatAmount,
      },
      { headerName: "Rule Violated", field: "ruleViolated", width: 150 },
      { headerName: "Reason", field: "reason", flex: 1, minWidth: 200, tooltipField: "reason" },
      { headerName: "PayPal Order", field: "paypalOrderId", width: 180 },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
    }),
    []
  );

  return (
    <div className="ledger-grid" style={{ height: 400 }}>
      <AgGridReact<LedgerEntry>
        theme={themeQuartz}
        rowData={entries}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        getRowId={(params) => params.data.id}
      />
    </div>
  );
}

