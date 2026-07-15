export type PurchaseOrderRequest = {
  itemName: string;
  merchant: string;
  productUrl: string;
  quantity: number;
  unitPrice: number;
  deliveryNotes: string;
  confirmationToken: string;
};

export type PurchaseOrderResponse =
  | { ok: true; orderId: string; status: "confirmed_pending_fulfilment" }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "INVALID_PAYLOAD" | "INVALID_CONFIRMATION" | "DATABASE_WRITE_FAILED" | "SCHEMA_OUTDATED";
    };

