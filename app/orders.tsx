import React, { useState, useRef, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  RefreshControl,
  Animated,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import { useLanguage } from "../lib/language";
import * as Print from "expo-print";

import { cancelOrderById, fetchUserOrdersList, type ApiOrderRow } from "../lib/ordersListApi";
import { fetchShiprocketTracking } from "../lib/shiprocketApi";

import api from "../services/api";

/** Path only — base URL comes from `services/api.tsx`. */
const ORDERS_API_PATH = "/api/orders";

const PLACEHOLDER_ORDER_IMAGE = require("../assets/images/age5.png");

function resolveApiImageUri(pathOrUrl: string): string {
  const s = String(pathOrUrl ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const base = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  if (!base) return s.startsWith("/") ? s : `/${s}`;
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}

function formatInrFromNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function parseApiNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

function formatOrderDate(isoOrStr: string): string {
  const d = new Date(isoOrStr);
  if (Number.isNaN(d.getTime())) return isoOrStr.slice(0, 16);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatOrderCreatedDateTime(raw: string): string {
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 16);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function pickLineItemsFromApiOrder(o: Record<string, unknown>): unknown[] {
  const candidates = [
    o.orderItems,
    o.items,
    o.products,
    o.lineItems,
    o.orderLines,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
  }
  return [];
}

function pickPrimaryImageFromLineItem(line: Record<string, unknown>): string {
  const product = line.product as Record<string, unknown> | undefined;
  const images = (product?.images ?? line.images) as unknown;
  if (Array.isArray(images) && images.length > 0) {
    const primary =
      images.find((img: unknown) => {
        const im = img as Record<string, unknown>;
        return im?.isPrimary === true;
      }) ?? images[0];
    const im = primary as Record<string, unknown>;
    const path = String(im?.imageUrl ?? im?.imagePath ?? im?.url ?? "").trim();
    if (path) return resolveApiImageUri(path);
  }
  const direct = String(
    line.imageUrl ?? line.productImage ?? line.thumbnailUrl ?? ""
  ).trim();
  return direct ? resolveApiImageUri(direct) : "";
}

function mapApiLineToProduct(
  line: unknown,
  idx: number,
  placeholder: any
): { id: string; productId?: number; name: string; image: any; quantity: number; price: string } | null {
  if (!line || typeof line !== "object") return null;
  const L = line as Record<string, unknown>;
  const qty = Math.max(1, Math.floor(parseApiNumber(L.quantity ?? L.qty ?? 1)));
  const priceNum = parseApiNumber(
    L.sellingPrice ?? L.price ?? L.unitPrice ?? L.finalPrice ?? L.amount
  );
  const name = String(
    (L.productName as string) ??
      ((L.product as Record<string, unknown>)?.name as string) ??
      L.name ??
      "Product"
  ).trim();
  const nestedProduct = L.product as Record<string, unknown> | undefined;
  const productIdRaw = L.productId ?? nestedProduct?.id ?? nestedProduct?.productId;
  const productIdNum = Math.floor(Number(productIdRaw));
  const productId =
    Number.isFinite(productIdNum) && productIdNum > 0 ? productIdNum : undefined;
  const id = String(
    productId ??
      L.id ??
      L.lineId ??
      L.orderItemId ??
      `line-${idx}`
  );
  const uri = pickPrimaryImageFromLineItem(L);
  return {
    id,
    productId,
    name: name || `Product ${idx + 1}`,
    image: uri ? { uri } : placeholder,
    quantity: qty,
    price: priceNum > 0 ? formatInrFromNumber(priceNum) : "—",
  };
}

type ApiOrdersTabStatus = "returns" | "cancelled" | "delivered" | "shipped" | "processing";
type ApiMappedOrderStatus = Exclude<OrderStatus, "all">;

function normalizeApiStatusToOrderStatus(statusRaw: unknown): ApiMappedOrderStatus {
  const s = String(statusRaw ?? "").trim().toLowerCase();
  if (s === "returned" || s === "returns" || s === "return") return "returns";
  if (s === "cancelled" || s === "canceled" || s === "cancel") return "cancelled";
  if (s === "delivered" || s === "complete" || s === "completed") return "delivered";
  if (s === "shipped" || s === "dispatch" || s === "dispatched") return "shipped";
  return "processing";
}

/**
 * Maps one API order row to UI `Order` (Processing / Shipped / Delivered / Returns / Cancelled from `/api/orders`).
 * Supports common Spring-style shapes; extend fields as backend stabilizes.
 */
function mapApiOrderRowToOrder(
  row: unknown,
  placeholderImage: any,
  uiStatus?: ApiOrdersTabStatus
): Order | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const idRaw = o.id ?? o.orderId ?? o.order_id;
  const id = idRaw != null ? String(idRaw).trim() : "";
  if (!id) return null;

  const orderNumber = String(
    o.orderNumber ?? o.orderNo ?? o.order_number ?? `#ORD-${id}`
  ).trim();

  const dateRaw =
    o.createdDate ?? o.createdAt ?? o.orderDate ?? o.date ?? o.orderedAt ?? o.placedAt;
  const date =
    typeof dateRaw === "string" && dateRaw
      ? formatOrderCreatedDateTime(dateRaw)
      : String(o.orderDate ?? "—");

  const lineItems = pickLineItemsFromApiOrder(o);
  const products = lineItems
    .map((line, i) => mapApiLineToProduct(line, i, placeholderImage))
    .filter((p): p is NonNullable<typeof p> => p != null);

  const itemCountFromApi = Math.floor(parseApiNumber(o.itemCount ?? o.totalItems));
  const items =
    itemCountFromApi > 0
      ? itemCountFromApi
      : products.length > 0
        ? products.reduce((s, p) => s + p.quantity, 0)
        : 1;

  const totalNum = parseApiNumber(
    o.totalAmount ?? o.grandTotal ?? o.total ?? o.payableAmount ?? o.amount
  );
  const total =
    totalNum > 0
      ? formatInrFromNumber(totalNum)
      : String(o.totalDisplay ?? o.totalFormatted ?? formatInrFromNumber(0));

  const firstLine = lineItems[0] as Record<string, unknown> | undefined;
  const cardImageUri =
    products[0]?.image && typeof products[0].image === "object" && "uri" in products[0].image
      ? String((products[0].image as { uri: string }).uri)
      : firstLine
        ? pickPrimaryImageFromLineItem(firstLine)
        : "";

  const tracking = String(o.trackingNumber ?? o.trackingNo ?? o.awb ?? "").trim() || undefined;
  const payment = String(o.paymentMethod ?? o.paymentType ?? o.paymentMode ?? "").trim() || undefined;
  const deliveryAddress = String(
    o.deliveryAddress ?? o.shippingAddress ?? o.address ?? o.fullAddress ?? ""
  ).trim() || undefined;

  let estimatedDelivery: string | undefined;
  if (uiStatus === "returns") {
    estimatedDelivery =
      String(o.returnStatus ?? o.statusMessage ?? o.returnMessage ?? "").trim() || undefined;
  } else if (uiStatus === "cancelled") {
    estimatedDelivery =
      String(
        o.cancelReason ??
          o.cancellationReason ??
          o.cancelledReason ??
          o.statusMessage ??
          ""
      ).trim() || undefined;
  } else if (uiStatus === "shipped") {
    const etaRaw =
      o.estimatedDelivery ??
      o.expectedDeliveryDate ??
      o.edd ??
      o.expectedDelivery ??
      o.deliveryEta;
    if (typeof etaRaw === "string" && etaRaw.trim()) {
      estimatedDelivery = `Expected: ${formatOrderDate(etaRaw)}`;
    }
    const shipRaw = o.shippedAt ?? o.shippedOn ?? o.dispatchDate ?? o.shippedDate;
    if (typeof shipRaw === "string" && shipRaw.trim()) {
      const shippedLine = `Shipped ${formatOrderDate(shipRaw)}`;
      estimatedDelivery = estimatedDelivery ? `${shippedLine} · ${estimatedDelivery}` : shippedLine;
    }
    if (!estimatedDelivery) {
      estimatedDelivery =
        String(o.statusMessage ?? o.shippingMessage ?? "").trim() || undefined;
    }
  } else if (uiStatus === "delivered") {
    const delRaw =
      o.deliveredAt ??
      o.deliveredOn ??
      o.deliveryDate ??
      o.actualDeliveryDate ??
      o.deliveredDate;
    if (typeof delRaw === "string" && delRaw.trim()) {
      estimatedDelivery = `Delivered on ${formatOrderDate(delRaw)}`;
    } else {
      estimatedDelivery =
        String(o.estimatedDelivery ?? o.deliveryMessage ?? o.statusMessage ?? "").trim() ||
        undefined;
    }
  } else {
    const etaRaw =
      o.estimatedDelivery ??
      o.expectedDeliveryDate ??
      o.expectedShipDate ??
      o.edd ??
      o.deliveryEta;
    if (typeof etaRaw === "string" && etaRaw.trim()) {
      estimatedDelivery = `Expected: ${formatOrderDate(etaRaw)}`;
    }
    estimatedDelivery =
      estimatedDelivery ||
      String(o.statusMessage ?? o.orderStatusMessage ?? "").trim() ||
      undefined;
  }

  const mappedStatus: ApiMappedOrderStatus =
    uiStatus ?? normalizeApiStatusToOrderStatus(o.status ?? o.orderStatus);
  const base: Order = {
    id,
    orderNumber: orderNumber || `#ORD-${id}`,
    date,
    status: mappedStatus,
    items,
    total,
    image: cardImageUri ? { uri: cardImageUri } : placeholderImage,
    trackingNumber: tracking,
    paymentMethod: payment,
    deliveryAddress,
    estimatedDelivery,
    products: products.length > 0 ? products : undefined,
  };

  if (mappedStatus === "returns") {
    return { ...base, returnStage: 2 };
  }
  return base;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type OrderStatus = "all" | "processing" | "shipped" | "delivered" | "cancelled" | "returns";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: number;
  total: string;
  image: any;
  trackingNumber?: string;
  paymentMethod?: string;
  /** From API: pending | paid | … */
  paymentStatus?: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  /** Optional UI stage for return orders (1–4). */
  returnStage?: 1 | 2 | 3 | 4;
  products?: {
    id: string;
    productId?: number;
    name: string;
    image: any;
    quantity: number;
    price: string;
  }[];
}

type InvoiceRow = {
  id: number;
  orderId: number;
  invoiceNumber: string;
  invoicePath?: string | null;
};

function escapeInvoiceHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInvoiceHtml(
  order: Order,
  invoiceNumber: string,
  details?: Record<string, unknown>
): string {
  const readField = (keys: string[], fallback = ""): string => {
    if (!details) return fallback;
    for (const key of keys) {
      const val = details[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    return fallback;
  };
  const formatMoney = (value: number): string => `₹${value.toFixed(2)}`;

  const soldByName = "SATYA SALES CORPORATION";
  const soldByAddressLine1 = "Shri Hakim Singh Shamshabad Road Barouli Aheer";
  const soldByAddressLine2 = "Agra, Uttar Pradesh, PIN: 282001";
  const soldByPhone = "+91 9012100264";
  const soldByEmail = "wugostore@gmail.com";
  const soldByGstin = "09AZUPL0595L1ZG";
  const brandName = "Flint & Thread (India) Pvt. Ltd.";
  const brandPhone = "+91 9063499092";
  const brandEmail = "support@flintnthread.in";
  const brandGstin = "36AAGCF5402J1ZP";

  const shippingAddress = readField(
    ["shippingAddress", "deliveryAddress", "address"],
    order.deliveryAddress?.trim() ||
      "Tara living women's pg, lingampally, Hyderabad, Telangana - 500019, India"
  );
  const customerName = readField(["customerName", "billingName", "name"], "Customer");
  const customerPhone = readField(["customerPhone", "phone"], "6300885700");
  const customerEmail = readField(
    ["customerEmail", "email"],
    "customer@example.com"
  );
  const invoiceDate = order.date?.trim() || new Date().toLocaleDateString("en-IN");
  const lineItems = order.products ?? [];
  const orderTotalNum = parseApiNumber(order.total.replace(/[^\d.]/g, ""));
  const subtotalNum =
    lineItems.length > 0
      ? lineItems.reduce((sum, p) => {
          const unit = parseApiNumber(String(p.price).replace(/[^\d.]/g, ""));
          return sum + unit * Math.max(1, p.quantity);
        }, 0)
      : orderTotalNum;
  const taxAmount = Math.max(0, orderTotalNum - subtotalNum);
  const igstPct = subtotalNum > 0 ? (taxAmount / subtotalNum) * 100 : 0;
  const deliveryCharge = parseApiNumber(details?.shippingCharge);
  const grandTotal = subtotalNum + taxAmount + deliveryCharge;

  const rowsHtml =
    lineItems.length > 0
      ? lineItems
          .map((p) => {
            const qty = Math.max(1, p.quantity);
            const unit = parseApiNumber(String(p.price).replace(/[^\d.]/g, ""));
            const lineTotal = qty * unit;
            return `
              <tr>
                <td>
                  <div class="item-title">${escapeInvoiceHtml(p.name)}</div>
                  <div class="item-sub">Color: Black &nbsp; Size: Medium</div>
                </td>
                <td>42021290</td>
                <td>${qty}</td>
                <td>${formatMoney(unit)}</td>
                <td>${igstPct > 0 ? `${igstPct.toFixed(0)}%` : "0%"}</td>
                <td>${formatMoney((lineTotal * igstPct) / 100)}</td>
                <td>${formatMoney(lineTotal + (lineTotal * igstPct) / 100)}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td><div class="item-title">${escapeInvoiceHtml(order.orderNumber)}</div></td>
            <td>42021290</td>
            <td>${Math.max(1, order.items)}</td>
            <td>${escapeInvoiceHtml(order.total)}</td>
            <td>${igstPct > 0 ? `${igstPct.toFixed(0)}%` : "0%"}</td>
            <td>${formatMoney(taxAmount)}</td>
            <td>${escapeInvoiceHtml(order.total)}</td>
          </tr>
        `;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${escapeInvoiceHtml(invoiceNumber)}</title>
    <style>
      body { margin: 0; padding: 16px; background: #f4f5f7; font-family: Arial, sans-serif; color: #111827; }
      .wrap { max-width: 980px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; }
      .top { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
      .brand-title { font-size: 28px; font-weight: 800; letter-spacing: 0.3px; margin: 0; }
      .brand-sub { color: #b45309; font-size: 12px; margin-top: 2px; font-weight: 600; }
      .line { width: 54px; height: 3px; background: #b91c1c; margin: 14px 0 10px; border-radius: 99px; }
      .txt { font-size: 14px; margin: 6px 0; color: #1f2937; }
      .txt.muted { color: #6b7280; }
      .inv-card { border: 1px solid #f4c7b5; border-left: 3px solid #b91c1c; border-radius: 10px; padding: 14px; background: #fffdfa; text-align: center; }
      .inv-title { margin: 0; color: #991b1b; font-weight: 800; letter-spacing: 0.8px; }
      .inv-meta { margin-top: 8px; font-size: 13px; color: #1f2937; line-height: 1.6; }
      .qr { width: 98px; height: 98px; margin: 12px auto 0; border: 1px solid #d1d5db; background:
        linear-gradient(90deg,#000 8px,transparent 8px) 0 0/16px 16px,
        linear-gradient(#000 8px,transparent 8px) 0 0/16px 16px,
        #fff; }
      .section { margin-top: 20px; }
      .section h3 { margin: 0; font-size: 28px; }
      .section-title { font-size: 28px; font-weight: 700; margin: 0 0 2px; color: #111827; }
      .sold-title { font-size: 28px; font-weight: 700; margin: 0; color: #1f2937; }
      .addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
      .addr-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; background: #fcfcfd; }
      .addr-head { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
      .table-wrap { margin-top: 14px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #0b2b66; color: #fff; font-size: 12px; letter-spacing: .3px; padding: 10px; text-align: left; }
      td { border-top: 1px solid #eef1f5; padding: 10px; font-size: 13px; vertical-align: top; }
      .item-title { font-weight: 700; color: #1f2937; }
      .item-sub { margin-top: 4px; color: #6b7280; font-size: 12px; }
      .totals { margin-top: 14px; margin-left: auto; width: 360px; }
      .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed #e5e7eb; font-size: 14px; }
      .row strong { font-size: 20px; }
      .free { color: #15803d; font-weight: 700; }
      .grand { font-size: 24px; color: #b45309; font-weight: 800; }
      .gst-box { margin-top: 18px; border: 1px solid #f6d4c6; border-left: 3px solid #b45309; border-radius: 8px; padding: 12px; background: #fffaf7; }
      .gst-title { margin: 0 0 10px; font-weight: 700; color: #9a3412; }
      .pay-box { margin-top: 18px; border-top: 1px solid #eceff3; padding-top: 14px; }
      .thank { margin-top: 22px; text-align: center; color: #b45309; font-weight: 700; }
      .foot { margin-top: 8px; text-align: center; color: #6b7280; font-size: 12px; }
      @media (max-width: 760px) {
        body { padding: 10px; }
        .wrap { padding: 12px; }
        .top, .addr-grid { grid-template-columns: 1fr; }
        .totals { width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="top">
        <div>
          <h1 class="brand-title">FLINT & THREAD</h1>
          <div class="brand-sub">The Infinity and Vanguard</div>
          <div class="line"></div>
          <div class="sold-title">${escapeInvoiceHtml(brandName)}</div>
          <div class="txt">India</div>
          <div class="txt">Phone: ${escapeInvoiceHtml(brandPhone)}</div>
          <div class="txt">Email: ${escapeInvoiceHtml(brandEmail)}</div>
          <div class="txt">GSTIN: ${escapeInvoiceHtml(brandGstin)}</div>
        </div>
        <div class="inv-card">
          <h2 class="inv-title">INVOICE</h2>
          <div class="inv-meta">
            ${escapeInvoiceHtml(invoiceNumber)}<br/>
            Order: ${escapeInvoiceHtml(order.orderNumber)}<br/>
            Date: ${escapeInvoiceHtml(invoiceDate)}
          </div>
          <div class="qr"></div>
          <div class="txt muted" style="font-size:11px; margin-top:8px;">Scan for order details</div>
        </div>
      </div>

      <div class="section">
        <div class="line"></div>
        <h3>Sold By:</h3>
        <div class="txt" style="font-weight:700;">${escapeInvoiceHtml(soldByName)}</div>
        <div class="txt">${escapeInvoiceHtml(soldByAddressLine1)}</div>
        <div class="txt">${escapeInvoiceHtml(soldByAddressLine2)}</div>
        <div class="txt">Phone: ${escapeInvoiceHtml(soldByPhone)}</div>
        <div class="txt">Email: ${escapeInvoiceHtml(soldByEmail)}</div>
        <div class="txt">GST: ${escapeInvoiceHtml(soldByGstin)}</div>
      </div>

      <div class="addr-grid">
        <div class="addr-card">
          <div class="addr-head">Bill To:</div>
          <div class="txt" style="font-weight:700;">${escapeInvoiceHtml(customerName)}</div>
          <div class="txt">${escapeInvoiceHtml(shippingAddress)}</div>
          <div class="txt">Phone: ${escapeInvoiceHtml(customerPhone)}</div>
          <div class="txt">Email: ${escapeInvoiceHtml(customerEmail)}</div>
        </div>
        <div class="addr-card">
          <div class="addr-head">Ship To:</div>
          <div class="txt" style="font-weight:700;">${escapeInvoiceHtml(customerName)}</div>
          <div class="txt">${escapeInvoiceHtml(shippingAddress)}</div>
          <div class="txt">Phone: ${escapeInvoiceHtml(customerPhone)}</div>
          <div class="txt">Email: ${escapeInvoiceHtml(customerEmail)}</div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ITEM DESCRIPTION</th>
              <th>HSN CODE</th>
              <th>QTY</th>
              <th>UNIT PRICE</th>
              <th>TAX %</th>
              <th>TAX AMOUNT</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>

      <div class="totals">
        <div class="row"><span>Subtotal (Before Tax)</span><span>${formatMoney(subtotalNum)}</span></div>
        <div class="row"><span>IGST @ ${igstPct > 0 ? igstPct.toFixed(2) : "0.00"}%</span><span>${formatMoney(taxAmount)}</span></div>
        <div class="row"><span>Shipping Charges</span><span class="${deliveryCharge <= 0 ? "free" : ""}">${deliveryCharge <= 0 ? "FREE" : formatMoney(deliveryCharge)}</span></div>
        <div class="row" style="border-bottom:0;"><strong>Grand Total</strong><span class="grand">${formatMoney(grandTotal)}</span></div>
      </div>

      <div class="gst-box">
        <p class="gst-title">GST Breakdown Summary</p>
        <div class="row"><span>Total CGST:</span><span>₹0.00</span></div>
        <div class="row"><span>Total SGST:</span><span>₹0.00</span></div>
        <div class="row"><span>Total IGST:</span><span>${formatMoney(taxAmount)}</span></div>
        <div class="row" style="border-bottom:0; font-weight:700;"><span>Total GST:</span><span>${formatMoney(taxAmount)}</span></div>
      </div>

      <div class="pay-box">
        <div class="section-title">Payment Information:</div>
        <div class="txt">Payment Method: ${escapeInvoiceHtml(readField(["paymentMethod"], order.paymentMethod || "Online Payment (Razorpay)"))}</div>
        <div class="txt">Payment Status: ${escapeInvoiceHtml(readField(["paymentStatus"], order.paymentStatus || "COMPLETED"))}</div>
        <div class="txt">Transaction ID: ${escapeInvoiceHtml(readField(["transactionId", "paymentId"], `pay_${order.id}${invoiceNumber.slice(-4)}`))}</div>
      </div>

      <div class="thank">Thank you for your business!</div>
      <div class="foot">If you have any questions about this invoice, please contact us at ${escapeInvoiceHtml(brandEmail)}</div>
      <div class="foot">Flint & Thread - The Infinity and Vanguard</div>
    </div>
  </body>
</html>`;
}

const sampleOrders: Order[] = [
  {
    id: "1",
    orderNumber: "#ORD-2024-001",
    date: "15 Jan 2024",
    status: "delivered",
    items: 2,
    total: "₹2,499",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK123456789",
    paymentMethod: "Credit Card",
    deliveryAddress: "123 Main Street, Apartment 4B",
    estimatedDelivery: "Delivered on 18 Jan 2024",
    products: [
      { id: "p1", name: "Premium Product A", image: require("../assets/images/age5.png"), quantity: 1, price: "₹1,299" },
      { id: "p2", name: "Premium Product B", image: require("../assets/images/age5.png"), quantity: 1, price: "₹1,200" },
    ],
  },
  {
    id: "2",
    orderNumber: "#ORD-2024-002",
    date: "18 Jan 2024",
    status: "shipped",
    items: 1,
    total: "₹1,299",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK987654321",
    paymentMethod: "UPI",
    deliveryAddress: "456 Park Avenue, Floor 2",
    estimatedDelivery: "Expected: 25 Jan 2024",
    products: [
      { id: "p3", name: "Premium Product C", image: require("../assets/images/age5.png"), quantity: 1, price: "₹1,299" },
    ],
  },
  {
    id: "3",
    orderNumber: "#ORD-2024-003",
    date: "20 Jan 2024",
    status: "processing",
    items: 3,
    total: "₹3,999",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK456789123",
    paymentMethod: "Debit Card",
    deliveryAddress: "789 Oak Street",
    estimatedDelivery: "Expected: 28 Jan 2024",
    products: [
      { id: "p4", name: "Premium Product D", image: require("../assets/images/age5.png"), quantity: 2, price: "₹2,000" },
      { id: "p5", name: "Premium Product E", image: require("../assets/images/age5.png"), quantity: 1, price: "₹1,999" },
    ],
  },
  {
    id: "4",
    orderNumber: "#ORD-2024-004",
    date: "22 Jan 2024",
    status: "delivered",
    items: 1,
    total: "₹899",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK789123456",
    paymentMethod: "Wallet",
    deliveryAddress: "321 Elm Street",
    estimatedDelivery: "Delivered on 24 Jan 2024",
    products: [
      { id: "p6", name: "Premium Product F", image: require("../assets/images/age5.png"), quantity: 1, price: "₹899" },
    ],
  },
  {
    id: "5",
    orderNumber: "#ORD-2024-005",
    date: "25 Jan 2024",
    status: "returns",
    returnStage: 2,
    items: 2,
    total: "₹1,599",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK111222333",
    paymentMethod: "Net Banking",
    deliveryAddress: "654 Pine Street",
    products: [
      { id: "p7", name: "Premium Product G", image: require("../assets/images/age5.png"), quantity: 2, price: "₹1,599" },
    ],
  },
  {
    id: "6",
    orderNumber: "#ORD-2024-006",
    date: "28 Jan 2024",
    status: "cancelled",
    items: 1,
    total: "₹1,499",
    image: require("../assets/images/age5.png"),
    paymentMethod: "UPI",
    deliveryAddress: "888 Pine Street",
    products: [
      { id: "p8", name: "Premium Product H", image: require("../assets/images/age5.png"), quantity: 1, price: "₹1,499" },
    ],
  },
];

function mapBackendOrderStatus(s?: string): OrderStatus {
  const x = (s || "").toLowerCase();
  if (x === "completed" || x === "delivered") return "delivered";
  if (x === "cancelled") return "cancelled";
  if (x === "returns" || x === "return") return "returns";
  if (x === "shipped") return "shipped";
  return "processing";
}

function mapApiOrderToUiOrder(row: ApiOrderRow): Order {
  const amt = row.finalAmount ?? row.totalAmount ?? 0;
  const totalStr = `₹${Math.round(amt).toLocaleString("en-IN")}`;
  const fallbackImage = require("../assets/images/age5.png");
  const itemsFromApi = Array.isArray((row as any).items) ? ((row as any).items as Array<Record<string, unknown>>) : [];
  const mappedProducts = itemsFromApi
    .map((it, idx) => {
      const productIdNum = Math.floor(Number(it.productId));
      const productId =
        Number.isFinite(productIdNum) && productIdNum > 0 ? productIdNum : undefined;
      const qty = Math.max(1, Math.floor(Number(it.quantity ?? 1)));
      const priceNum = Number(it.price ?? 0);
      const imgRaw = String(it.productImage ?? "").trim();
      const image = imgRaw ? { uri: resolveApiImageUri(imgRaw) } : fallbackImage;
      return {
        id: String(productId ?? `api-item-${idx}`),
        productId,
        name: String(it.productName ?? `Product ${idx + 1}`),
        image,
        quantity: qty,
        price: priceNum > 0 ? `₹${Math.round(priceNum).toLocaleString("en-IN")}` : "—",
      };
    })
    .filter((p) => Boolean(p.name));

  const firstApiImage = String(row.firstProductImage ?? "").trim();
  const img = firstApiImage
    ? { uri: resolveApiImageUri(firstApiImage) }
    : mappedProducts[0]?.image ?? fallbackImage;

  const countFromItems = mappedProducts.reduce((sum, p) => sum + Math.max(1, p.quantity), 0);
  const n = Math.max(0, row.totalItems ?? countFromItems);
  const num = row.orderNumber?.trim() || "";
  const displayNum = num.startsWith("#") ? num : `#${num}`;
  return {
    id: String(row.orderId),
    orderNumber: displayNum,
    date: row.createdDate ? formatOrderCreatedDateTime(row.createdDate) : "",
    status: mapBackendOrderStatus(row.orderStatus),
    items: n > 0 ? n : 1,
    total: totalStr,
    image: img,
    trackingNumber: row.shiprocketAwbCode?.trim() || undefined,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    deliveryAddress: row.shippingAddress,
    estimatedDelivery: row.shiprocketStatus
      ? String(row.shiprocketStatus) +
        (row.shiprocketCourierName ? ` · ${row.shiprocketCourierName}` : "")
      : undefined,
    products: mappedProducts.length > 0 ? mappedProducts : undefined,
  };
}

export default function OrdersScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  /** All orders from `GET /api/orders` (All tab only). */
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [allOrdersError, setAllOrdersError] = useState<string | null>(null);
  /** Returned orders from `GET /api/orders?status=returned` (Returns tab only). */
  const [returnOrders, setReturnOrders] = useState<Order[]>([]);
  const [returnOrdersLoading, setReturnOrdersLoading] = useState(false);
  const [returnOrdersError, setReturnOrdersError] = useState<string | null>(null);
  /** Cancelled orders from `GET /api/orders?status=cancelled` (Cancelled tab only). */
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [cancelledOrdersLoading, setCancelledOrdersLoading] = useState(false);
  const [cancelledOrdersError, setCancelledOrdersError] = useState<string | null>(null);
  /** Delivered orders from `GET /api/orders?status=delivered` (Delivered tab only). */
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [deliveredOrdersLoading, setDeliveredOrdersLoading] = useState(false);
  const [deliveredOrdersError, setDeliveredOrdersError] = useState<string | null>(null);
  /** Shipped orders from `GET /api/orders?status=shipped` (Shipped tab only). */
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);
  const [shippedOrdersLoading, setShippedOrdersLoading] = useState(false);
  const [shippedOrdersError, setShippedOrdersError] = useState<string | null>(null);
  /** Processing orders from `GET /api/orders?status=processing` (Processing tab only). */
  const [processingOrders, setProcessingOrders] = useState<Order[]>([]);
  const [processingOrdersLoading, setProcessingOrdersLoading] = useState(false);
  const [processingOrdersError, setProcessingOrdersError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  // Android hardware back should step back within this screen
  // (Details -> list, close modals/search) before leaving the page.
  useEffect(() => {
    const onHardwareBackPress = () => {
      if (showCancelModal) {
        setShowCancelModal(false);
        return true;
      }
      if (showSearch) {
        setShowSearch(false);
        setSearchQuery("");
        searchInputRef.current?.blur();
        return true;
      }
      if (showDetails) {
        setShowDetails(false);
        return true;
      }
      return false; // allow default behaviour (router back)
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
    return () => sub.remove();
  }, [showCancelModal, showSearch, showDetails]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearch]);


  const loadOrdersFromApi = useCallback(async () => {
    try {
      const token = (await AsyncStorage.getItem("token"))?.trim();
      if (!token) {
        setOrders(sampleOrders);
        return;
      }
      const rows = await fetchUserOrdersList();
      setOrders(rows.length > 0 ? rows.map((r) => mapApiOrderToUiOrder(r as ApiOrderRow)) : []);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void loadOrdersFromApi();
  }, [loadOrdersFromApi]);

  const handleTrackOrder = async (order: Order | null) => {
    if (!order?.trackingNumber?.trim()) {
      Alert.alert(tr("Tracking"), tr("No tracking number for this order yet."));
      return;
    }
    try {
      const raw = await fetchShiprocketTracking(order.trackingNumber.trim());
      const text = raw.length > 3200 ? `${raw.slice(0, 3200)}…` : raw;
      Alert.alert(tr("Shipment tracking"), text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(tr("Tracking"), msg);
    }
  };

  const fetchReturnOrders = useCallback(async () => {
    setReturnOrdersLoading(true);
    setReturnOrdersError(null);
    try {
      const { data } = await api.get<{
        success?: boolean;
        message?: string;
        data?: unknown;
      }>(ORDERS_API_PATH, {
        params: { status: "returned" },
      });
      const payload = data as Record<string, unknown>;
      const listRaw = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
      const mapped = listRaw
        .map((row) => mapApiOrderRowToOrder(row, PLACEHOLDER_ORDER_IMAGE, "returns"))
        .filter((x): x is Order => x != null);
      setReturnOrders(mapped);
    } catch {
      setReturnOrders([]);
      setReturnOrdersError(tr("Could not load returned orders. Pull to refresh or try again."));
    } finally {
      setReturnOrdersLoading(false);
    }
  }, [tr]);

  const fetchAllOrders = useCallback(async () => {
    setAllOrdersLoading(true);
    setAllOrdersError(null);
    try {
      const { data } = await api.get<{
        success?: boolean;
        message?: string;
        data?: unknown;
      }>(ORDERS_API_PATH);
      const payload = data as Record<string, unknown>;
      const listRaw = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
      const mapped = listRaw
        .map((row) => mapApiOrderRowToOrder(row, PLACEHOLDER_ORDER_IMAGE))
        .filter((x): x is Order => x != null);
      setAllOrders(mapped);
    } catch {
      setAllOrders([]);
      setAllOrdersError(tr("Could not load orders. Pull to refresh or try again."));
    } finally {
      setAllOrdersLoading(false);
    }
  }, [tr]);

  const fetchCancelledOrders = useCallback(async () => {
    setCancelledOrdersLoading(true);
    setCancelledOrdersError(null);
    try {
      const { data } = await api.get<{
        success?: boolean;
        message?: string;
        data?: unknown;
      }>(ORDERS_API_PATH, {
        params: { status: "cancelled" },
      });
      const payload = data as Record<string, unknown>;
      const listRaw = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
      const mapped = listRaw
        .map((row) => mapApiOrderRowToOrder(row, PLACEHOLDER_ORDER_IMAGE, "cancelled"))
        .filter((x): x is Order => x != null);
      setCancelledOrders(mapped);
    } catch {
      setCancelledOrders([]);
      setCancelledOrdersError(
        tr("Could not load cancelled orders. Pull to refresh or try again.")
      );
    } finally {
      setCancelledOrdersLoading(false);
    }
  }, [tr]);

  const fetchDeliveredOrders = useCallback(async () => {
    setDeliveredOrdersLoading(true);
    setDeliveredOrdersError(null);
    try {
      const { data } = await api.get<{
        success?: boolean;
        message?: string;
        data?: unknown;
      }>(ORDERS_API_PATH, {
        params: { status: "delivered" },
      });
      const payload = data as Record<string, unknown>;
      const listRaw = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
      const mapped = listRaw
        .map((row) => mapApiOrderRowToOrder(row, PLACEHOLDER_ORDER_IMAGE, "delivered"))
        .filter((x): x is Order => x != null);
      setDeliveredOrders(mapped);
    } catch {
      setDeliveredOrders([]);
      setDeliveredOrdersError(
        tr("Could not load delivered orders. Pull to refresh or try again.")
      );
    } finally {
      setDeliveredOrdersLoading(false);
    }
  }, [tr]);

  const fetchShippedOrders = useCallback(async () => {
    setShippedOrdersLoading(true);
    setShippedOrdersError(null);
    try {
      const { data } = await api.get<{
        success?: boolean;
        message?: string;
        data?: unknown;
      }>(ORDERS_API_PATH, {
        params: { status: "shipped" },
      });
      const payload = data as Record<string, unknown>;
      const listRaw = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
      const mapped = listRaw
        .map((row) => mapApiOrderRowToOrder(row, PLACEHOLDER_ORDER_IMAGE, "shipped"))
        .filter((x): x is Order => x != null);
      setShippedOrders(mapped);
    } catch {
      setShippedOrders([]);
      setShippedOrdersError(
        tr("Could not load shipped orders. Pull to refresh or try again.")
      );
    } finally {
      setShippedOrdersLoading(false);
    }
  }, [tr]);

  const fetchProcessingOrders = useCallback(async () => {
    setProcessingOrdersLoading(true);
    setProcessingOrdersError(null);
    try {
      const { data } = await api.get<{
        success?: boolean;
        message?: string;
        data?: unknown;
      }>(ORDERS_API_PATH, {
        params: { status: "processing" },
      });
      const payload = data as Record<string, unknown>;
      const listRaw = Array.isArray(payload.data) ? (payload.data as unknown[]) : [];
      const mapped = listRaw
        .map((row) => mapApiOrderRowToOrder(row, PLACEHOLDER_ORDER_IMAGE, "processing"))
        .filter((x): x is Order => x != null);
      setProcessingOrders(mapped);
    } catch {
      setProcessingOrders([]);
      setProcessingOrdersError(
        tr("Could not load processing orders. Pull to refresh or try again.")
      );
    } finally {
      setProcessingOrdersLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    if (activeTab === "all") {
      void fetchAllOrders();
    }
  }, [activeTab, fetchAllOrders]);

  useEffect(() => {
    if (activeTab === "returns") {
      void fetchReturnOrders();
    }
  }, [activeTab, fetchReturnOrders]);

  useEffect(() => {
    if (activeTab === "cancelled") {
      void fetchCancelledOrders();
    }
  }, [activeTab, fetchCancelledOrders]);

  useEffect(() => {
    if (activeTab === "delivered") {
      void fetchDeliveredOrders();
    }
  }, [activeTab, fetchDeliveredOrders]);

  useEffect(() => {
    if (activeTab === "shipped") {
      void fetchShippedOrders();
    }
  }, [activeTab, fetchShippedOrders]);

  useEffect(() => {
    if (activeTab === "processing") {
      void fetchProcessingOrders();
    }
  }, [activeTab, fetchProcessingOrders]);


  const getFilteredOrders = () => {
    let filtered: Order[] =
      activeTab === "returns"
        ? returnOrders
        : activeTab === "cancelled"
          ? cancelledOrders
          : activeTab === "delivered"
            ? deliveredOrders
            : activeTab === "shipped"
              ? shippedOrders
              : activeTab === "processing"
                ? processingOrders
                : activeTab === "all"
                  ? allOrders
                  : orders.filter((order) => order.status === activeTab);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.trackingNumber?.toLowerCase().includes(query) ||
          order.products?.some((p) => p.name.toLowerCase().includes(query)) ||
          order.paymentMethod?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return { color: "#10B981", bgColor: "#D1FAE5", icon: "checkmark-circle", text: tr("Delivered") };
      case "shipped":
        return { color: "#3B82F6", bgColor: "#DBEAFE", icon: "car", text: tr("Shipped") };
      case "processing":
        return { color: "#F59E0B", bgColor: "#FEF3C7", icon: "time", text: tr("Processing") };
      case "cancelled":
        return { color: "#EF4444", bgColor: "#FEE2E2", icon: "close-circle", text: tr("Cancelled") };
      case "returns":
        return { color: "#8B5CF6", bgColor: "#EDE9FE", icon: "return-down-back", text: tr("Return") };
      default:
        return { color: "#6B7280", bgColor: "#F3F4F6", icon: "ellipse", text: status };
    }
  };

  const tabs = [
    { key: "all" as OrderStatus, label: tr("All"), icon: "list" },
    { key: "processing" as OrderStatus, label: tr("Processing"), icon: "time-outline" },
    { key: "shipped" as OrderStatus, label: tr("Shipped"), icon: "car-outline" },
    { key: "delivered" as OrderStatus, label: tr("Delivered"), icon: "checkmark-circle-outline" },
    { key: "cancelled" as OrderStatus, label: tr("Cancelled"), icon: "close-circle-outline" },
    { key: "returns" as OrderStatus, label: tr("Returns"), icon: "return-down-back-outline" },
  ];

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {

      await loadOrdersFromApi();

      if (activeTab === "returns") {
        await fetchReturnOrders();
      } else if (activeTab === "all") {
        await fetchAllOrders();
      } else if (activeTab === "cancelled") {
        await fetchCancelledOrders();
      } else if (activeTab === "delivered") {
        await fetchDeliveredOrders();
      } else if (activeTab === "shipped") {
        await fetchShippedOrders();
      } else if (activeTab === "processing") {
        await fetchProcessingOrders();
      }

    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert(tr("Required"), tr("Please provide a reason"));
      return;
    }
    if (!selectedOrder || selectedOrder.status !== "processing") {
      Alert.alert(tr("Not allowed"), tr("Only processing orders can be cancelled"));
      return;
    }
    try {
      const result = await cancelOrderById(Number(selectedOrder.id));
      if (!result.success) {
        Alert.alert(tr("Cancel failed"), tr(result.message));
        return;
      }
      await loadOrdersFromApi();
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: "cancelled", estimatedDelivery: tr("Order cancelled") } : prev
      );
      Alert.alert(tr("Success"), tr(result.message));
      setShowCancelModal(false);
      setCancelReason("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not cancel order.";
      Alert.alert(tr("Cancel failed"), tr(msg));
    }
  };

  const openReturnExchange = (mode: "return" | "exchange") => {
    if (!selectedOrder) return;
    router.push({
      pathname: "/return-exchange" as any,
      params: {
        mode,
        orderNumber: selectedOrder.orderNumber,
        productName: selectedOrder.products?.[0]?.name ?? "Product",
        productPrice: selectedOrder.products?.[0]?.price ?? selectedOrder.total,
      },
    });
  };

  const handleDownloadInvoice = async (order: Order) => {
    const orderId = parseInt(String(order.id).replace(/\D/g, ''), 10);
    try {
      const fallbackNumber = Number.isFinite(orderId) && orderId > 0 ? Math.floor(orderId) : order.id;
      const invoiceNumber = `INV-${fallbackNumber}`;
      const html = buildInvoiceHtml(order, invoiceNumber);
      await Print.printAsync({
        html,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : tr("Could not download invoice right now.");
      Alert.alert(tr("Invoice"), message);
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        {!showSearch ? (
          <>
            <TouchableOpacity
              onPress={() => {
                if (showDetails) {
                  setShowDetails(false);
                  return;
                }
                router.back();
              }}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{showDetails ? tr("Order Details") : tr("My Orders")}</Text>
              {!showDetails && (
                <Text style={styles.headerSubtitle}>{filteredOrders.length} {tr("orders")}</Text>
              )}
            </View>
            {!showDetails ? (
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={24} color="#111827" />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
          </>
        ) : (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={tr("Search orders, tracking number...")}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
                searchInputRef.current?.blur();
              }}
              style={styles.cancelSearchBtn}
            >
              <Text style={styles.cancelSearchText}>{tr("Cancel")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      {!showDetails && (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={isActive ? "#FFFFFF" : "#6B7280"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Orders List */}
      {showDetails && selectedOrder ? (
        <OrderDetailsView
          order={selectedOrder}
          onCancel={() => setShowCancelModal(true)}
          onReturn={() => openReturnExchange("return")}
          onExchange={() => openReturnExchange("exchange")}
          onTrackPackage={() => void handleTrackOrder(selectedOrder)}
          onWriteReview={(productId) => {
            if (!productId || productId <= 0) {
              Alert.alert(tr("Review"), tr("Product is unavailable for review."));
              return;
            }
            router.push({
              pathname: "/productdetail",
              params: { id: String(productId), openReview: "1", fromOrders: "1" },
            } as any);
          }}
          onDownloadInvoice={() => void handleDownloadInvoice(selectedOrder)}
          getStatusConfig={getStatusConfig}
        />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {(activeTab === "returns" && returnOrdersLoading) ||
          (activeTab === "all" && allOrdersLoading) ||
          (activeTab === "cancelled" && cancelledOrdersLoading) ||
          (activeTab === "delivered" && deliveredOrdersLoading) ||
          (activeTab === "shipped" && shippedOrdersLoading) ||
          (activeTab === "processing" && processingOrdersLoading) ? (
            <View style={styles.returnsLoadingBox}>
              <ActivityIndicator size="large" color="#E97A1F" />
              <Text style={styles.returnsLoadingText}>
                {activeTab === "cancelled"
                  ? tr("Loading cancelled orders…")
                  : activeTab === "all"
                    ? tr("Loading orders…")
                  : activeTab === "delivered"
                    ? tr("Loading delivered orders…")
                    : activeTab === "shipped"
                      ? tr("Loading shipped orders…")
                      : activeTab === "processing"
                        ? tr("Loading processing orders…")
                        : tr("Loading returned orders…")}
              </Text>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery.trim() ? "search-outline" : "receipt-outline"} 
                size={80} 
                color="#D1D5DB" 
              />
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? tr("No results found") : tr("No orders found")}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim() 
                  ? `${tr("No orders match")} "${searchQuery}"` 
                  : activeTab === "returns" && returnOrdersError
                    ? returnOrdersError
                    : activeTab === "cancelled" && cancelledOrdersError
                      ? cancelledOrdersError
                      : activeTab === "delivered" && deliveredOrdersError
                        ? deliveredOrdersError
                        : activeTab === "shipped" && shippedOrdersError
                          ? shippedOrdersError
                          : activeTab === "processing" && processingOrdersError
                            ? processingOrdersError
                            : activeTab === "all" && allOrdersError
                              ? allOrdersError
                              : activeTab === "all" 
                    ? tr("Start shopping to see your orders here") 
                    : `${tr("No")} ${getStatusConfig(activeTab).text.toLowerCase()} ${tr("orders")}`}
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => {
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                >
                  <Text style={styles.clearSearchText}>{tr("Clear Search")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.ordersList}>
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => handleOrderPress(order)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                        <Text style={styles.orderDate}>{order.date}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.text}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderCardBody}>
                      <Image source={order.image} style={styles.orderImage} />
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderItemsText}>
                          {order.items} {order.items === 1 ? tr("item") : tr("items")}
                        </Text>
                        <Text style={styles.orderTotal}>{order.total}</Text>
                      </View>
                    </View>

                    {order.trackingNumber && (
                      <View style={styles.trackingInfo}>
                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                        <Text style={styles.trackingText}>{order.trackingNumber}</Text>
                      </View>
                    )}

                    <View style={styles.orderCardFooter}>
                      <TouchableOpacity
                        style={styles.viewDetailsBtn}
                        onPress={() => handleOrderPress(order)}
                      >
                        <Text style={styles.viewDetailsText}>{tr("View Details")}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#E97A1F" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cancel Modal */}
      <CancelModal
        visible={showCancelModal}
        order={selectedOrder}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />

      <HomeBottomTabBar />
    </View>
  );
}

// Order Details Component
function OrderDetailsView({
  order,
  onCancel,
  onReturn,
  onExchange,
  onTrackPackage,
  onWriteReview,
  onDownloadInvoice,
  getStatusConfig,
}: {
  order: Order;
  onCancel: () => void;
  onReturn: () => void;
  onExchange: () => void;
  onTrackPackage: () => void;
  onWriteReview: (productId?: number) => void;
  onDownloadInvoice: () => void;
  getStatusConfig: (status: OrderStatus) => any;
}) {
  const { tr } = useLanguage();
  const statusConfig = getStatusConfig(order.status);

  return (
    <ScrollView
      style={styles.detailsContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 90 }}
    >
      {/* Order Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <View>
            <Text style={styles.statusCardLabel}>{tr("Order Status")}</Text>
            <Text style={styles.statusCardValue}>{statusConfig.text}</Text>
          </View>
          <View style={[styles.statusIconWrapper, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon as any} size={32} color={statusConfig.color} />
          </View>
        </View>
        {order.estimatedDelivery && (
          <View style={styles.deliveryInfo}>
            <Ionicons name="time-outline" size={16} color="#F59E0B" />
            <Text style={styles.deliveryText}>{order.estimatedDelivery}</Text>
          </View>
        )}

        {/* Processing-only progress like reference */}
        {order.status === "processing" && (
          <View style={styles.processingTrackerWrap}>
            {/* Visual state matches common e-commerce trackers while still "Processing" */}
            <OrderProgressStepper currentStep={3} />
            <View style={styles.processingMessageWrap}>
              <Text style={styles.processingMessageTitle}>{tr("We’re preparing your order")}</Text>
              <Text style={styles.processingMessageSub}>
                {tr("Your items are being picked and packed. You’ll get an update when it ships.")}
              </Text>
            </View>
          </View>
        )}

        {order.status === "returns" && (
          <View style={styles.returnTrackerWrap}>
            <OrderProgressStepper
              variant="returns"
              currentStep={order.returnStage ?? 2}
            />
            <View style={styles.returnMessageWrap}>
              <Text style={styles.returnMessageTitle}>{tr("Return is in progress")}</Text>
              <Text style={styles.returnMessageSub}>
                {tr("We’ll keep you posted at every step — from pickup to refund completion.")}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Order Info */}
      <View style={styles.infoCard}>
        <InfoRow label={tr("Order Number")} value={order.orderNumber} />
        <InfoRow label={tr("Order Date")} value={order.date} />
        {order.paymentStatus && (
          <InfoRow label={tr("Payment")} value={order.paymentStatus} />
        )}
        {order.trackingNumber && (
          <InfoRow label={tr("Tracking Number")} value={order.trackingNumber} highlight />
        )}
        {order.paymentMethod && (
          <InfoRow label={tr("Payment Method")} value={order.paymentMethod} />
        )}
      </View>

      {/* Products */}
      <View style={styles.productsCard}>
        <Text style={styles.cardTitle}>{tr("Products")} ({order.items})</Text>
        {order.products?.map((product) => (
          <View key={product.id} style={styles.productItem}>
            <Image source={product.image} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>
                {tr("Qty")}: {product.quantity} × {product.price}
              </Text>
              {order.status !== "cancelled" && product.productId ? (
                <TouchableOpacity
                  style={styles.writeReviewOrderBtn}
                  activeOpacity={0.85}
                  onPress={() => onWriteReview(product.productId)}
                >
                  <Text style={styles.writeReviewOrderBtnText}>{tr("Write Review")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.productPrice}>{product.price}</Text>
          </View>
        ))}
      </View>

      {/* Address */}
      {order.deliveryAddress && (
        <View style={styles.infoCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color="#E97A1F" />
            <Text style={styles.cardTitle}>{tr("Delivery Address")}</Text>
          </View>
          <Text style={styles.addressText}>{order.deliveryAddress}</Text>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>{tr("Order Summary")}</Text>
        <SummaryRow label={tr("Subtotal")} value={order.total} />
        <SummaryRow label={tr("Shipping")} value="₹99" />
        <SummaryRow label={tr("Tax")} value="₹0" />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{tr("Total")}</Text>
          <Text style={styles.totalValue}>{order.total}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {order.status === "processing" && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.cancelBtnText}>{tr("Cancel Order")}</Text>
          </TouchableOpacity>
        )}
        {order.trackingNumber && order.status !== "cancelled" && (
          <TouchableOpacity style={styles.trackBtn} onPress={onTrackPackage} activeOpacity={0.9}>
            <Ionicons name="location" size={20} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>{tr("Track Package")}</Text>
          </TouchableOpacity>
        )}
        {order.status === "delivered" && (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => Alert.alert(tr("Success"), tr("Added to cart"))}
            >
              <Ionicons name="cart" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{tr("Buy Again")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onReturn}>
              <Ionicons name="return-down-back" size={20} color="#2196F3" />
              <Text style={styles.secondaryBtnText}>{tr("Return / Exchange")}</Text>
            </TouchableOpacity>
          </>
        )}
        {order.status === "returns" && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onReturn}>
            <Ionicons name="refresh" size={20} color="#8B5CF6" />
            <Text style={[styles.secondaryBtnText, { color: "#8B5CF6" }]}>{tr("Return/Exchange")}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryBtn} onPress={onDownloadInvoice}>
          <Ionicons name="receipt-outline" size={20} color="#6B7280" />
          <Text style={[styles.secondaryBtnText, { color: "#6B7280" }]}>{tr("Download Invoice")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function OrderProgressStepper({
  currentStep,
  variant = "fulfillment",
}: {
  currentStep: 1 | 2 | 3 | 4;
  variant?: "fulfillment" | "returns";
}) {
  const steps =
    variant === "returns"
      ? ([
          { key: 1 as const, label: "Return\nRequested", icon: "return-down-back-outline" as const },
          { key: 2 as const, label: "Item\nReceived", icon: "cube-outline" as const },
          { key: 3 as const, label: "Quality\nCheck", icon: "search-outline" as const },
          { key: 4 as const, label: "Refund\nCompleted", icon: "cash-outline" as const },
        ] as const)
      : ([
          { key: 1 as const, label: "Order\nPlaced", icon: "bag-outline" as const },
          { key: 2 as const, label: "Shipped", icon: "cube-outline" as const },
          { key: 3 as const, label: "In Transit", icon: "car-outline" as const },
          { key: 4 as const, label: "Delivered", icon: "checkmark" as const },
        ] as const);

  const clampedStep = Math.min(4, Math.max(1, currentStep)) as 1 | 2 | 3 | 4;
  const lineFillPct: Record<1 | 2 | 3 | 4, number> = {
    1: 18,
    2: 44,
    // Line reaches the end visually (like reference), while last node stays "pending"
    3: 100,
    4: 100,
  };
  const lineFillColor =
    clampedStep >= 3
      ? "rgba(0, 0, 0, 0)"
      : variant === "returns"
        ? "rgba(124, 58, 237, 0.55)"
        : "rgba(37, 99, 235, 0.55)";

  const trackBg = variant === "returns" ? "#EDE9FE" : "#CFE3F5";
  const completeFill = variant === "returns" ? "#DDD6FE" : "#CFE3F5";
  const completeBorder = variant === "returns" ? "#DDD6FE" : "#CFE3F5";
  const futureBg = variant === "returns" ? "#F5F3FF" : "#F4FAFF";
  const futureBorder = variant === "returns" ? "#E9D5FF" : "#D7E8F7";
  const currentBorder = variant === "returns" ? "#7C3AED" : "#3B82F6";
  const currentBg = variant === "returns" ? "#F3E8FF" : "#EFF6FF";
  const pendingBorder = variant === "returns" ? "#DDD6FE" : "#CFE3F5";
  const shadow = variant === "returns" ? "#7C3AED" : "#2563EB";

  const iconComplete = variant === "returns" ? "#5B21B6" : "#0B4F7A";
  const iconCurrent = variant === "returns" ? "#6D28D9" : "#1D4ED8";
  const iconMuted = variant === "returns" ? "#A78BFA" : "#7AA6C9";
  const iconFuture = variant === "returns" ? "#9CA3AF" : "#94A3B8";

  return (
    <View style={styles.stepperWrap}>
      <View style={[styles.stepperLineTrack, { backgroundColor: trackBg }]}>
        <View
          style={[
            styles.stepperLineFill,
            { width: `${lineFillPct[clampedStep]}%`, backgroundColor: lineFillColor },
          ]}
        />
      </View>
      <View style={styles.stepperRow}>
        {steps.map((s) => {
          const isComplete = s.key < clampedStep;
          const isCurrent = s.key === clampedStep;
          const isFuture = s.key > clampedStep;

          const isDeliveredNode = s.key === 4;
          const deliveredPending = isDeliveredNode && clampedStep < 4;
          const deliveredDone = isDeliveredNode && clampedStep === 4;

          let circleStyle = [
            styles.stepCircleBase,
            { shadowColor: shadow },
            { borderColor: futureBorder, backgroundColor: futureBg },
          ];
          if (deliveredPending) {
            circleStyle = [
              styles.stepCircleBase,
              { shadowColor: shadow },
              { borderColor: pendingBorder, backgroundColor: "#FFFFFF" },
            ];
          } else if (isComplete || deliveredDone) {
            circleStyle = [
              styles.stepCircleBase,
              { shadowColor: shadow },
              { borderColor: completeBorder, backgroundColor: completeFill },
            ];
          } else if (isCurrent) {
            circleStyle = [
              styles.stepCircleBase,
              { shadowColor: shadow, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 },
              { borderColor: currentBorder, backgroundColor: currentBg },
            ];
          }

          let iconColor = iconFuture;
          if (deliveredPending) iconColor = iconMuted;
          else if (isComplete || deliveredDone) iconColor = iconComplete;
          else if (isCurrent) iconColor = iconCurrent;

          const labelStyle = isFuture && !deliveredPending ? styles.stepLabelMuted : styles.stepLabelRef;

          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              style={styles.stepNodeRef}
              onPress={() => {}}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={circleStyle}>
                <Ionicons
                  name={s.icon as any}
                  size={22}
                  color={iconColor}
                  style={isDeliveredNode ? { marginLeft: 1 } : undefined}
                />
              </View>
              <Text style={labelStyle} numberOfLines={2}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Info Row Component
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

// Summary Row Component
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// Cancel Modal Component
function CancelModal({
  visible,
  order,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  order: Order | null;
  reason: string;
  onReasonChange: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { tr } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{tr("Cancel Order")}</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          {order && (
            <View style={styles.modalOrderInfo}>
              <Text style={styles.modalOrderLabel}>{tr("Order")}: {order.orderNumber}</Text>
              <Text style={styles.modalOrderValue}>{tr("Amount")}: {order.total}</Text>
            </View>
          )}
          <Text style={styles.modalLabel}>{tr("Reason for cancellation")}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={tr("Enter reason...")}
            multiline
            value={reason}
            onChangeText={onReasonChange}
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>{tr("Keep Order")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>{tr("Cancel Order")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Return Modal Component
function ReturnModal({
  visible,
  order,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  order: Order | null;
  reason: string;
  onReasonChange: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { tr } = useLanguage();
  const reasons = ["Wrong Item", "Defective", "Size Issue", "Not as Described", "Other"];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{tr("Return / Replace")}</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          {order && (
            <View style={styles.modalProductInfo}>
              <Image source={order.image} style={styles.modalProductImage} />
              <View>
                <Text style={styles.modalProductName}>{tr(order.products?.[0]?.name || "Product")}</Text>
                <Text style={styles.modalProductMeta}>{order.orderNumber}</Text>
              </View>
            </View>
          )}
          <Text style={styles.modalLabel}>{tr("Select reason")}</Text>
          {reasons.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonBtn, reason === r && styles.reasonBtnActive]}
              onPress={() => onReasonChange(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{tr(r)}</Text>
              {reason === r && <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />}
            </TouchableOpacity>
          ))}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>{tr("Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>{tr("Submit")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  searchBtn: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  cancelSearchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelSearchText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E97A1F",
  },
  placeholder: {
    width: 32,
  },
  tabsWrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#E97A1F",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  returnsLoadingBox: {
    flex: 1,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  returnsLoadingText: {
    marginTop: 14,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  clearSearchBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#E97A1F",
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderCardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderItemsText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
  },
  trackingInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 12,
  },
  trackingText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  orderCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E97A1F",
    marginRight: 4,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusCardLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statusIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  deliveryText: {
    fontSize: 14,
    color: "#111827",
    marginLeft: 8,
    fontWeight: "500",
  },
  processingTrackerWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  returnTrackerWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  stepperWrap: {
    position: "relative",
    paddingTop: 6,
    paddingBottom: 2,
    overflow: "visible",
  },
  stepperLineTrack: {
    position: "absolute",
    left: 44,
    right: 44,
    top: 6 + 26, // centers line relative to 52px circle
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  stepperLineFill: {
    height: "100%",
    borderRadius: 999,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepNodeRef: {
    width: 78,
    alignItems: "center",
  },
  stepCircleBase: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  stepLabelRef: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    lineHeight: 16,
  },
  stepLabelMuted: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  processingMessageWrap: {
    marginTop: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  processingMessageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  processingMessageSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 16,
  },
  returnMessageWrap: {
    marginTop: 12,
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  returnMessageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  returnMessageSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  infoValueHighlight: {
    color: "#E97A1F",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  productsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  writeReviewOrderBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E97A1F",
    backgroundColor: "#FFF7ED",
  },
  writeReviewOrderBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E97A1F",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E97A1F",
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E97A1F",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalOrderInfo: {
    padding: 20,
    backgroundColor: "#F9FAFB",
    margin: 20,
    borderRadius: 12,
  },
  modalOrderLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  modalOrderValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalProductInfo: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#F9FAFB",
    margin: 20,
    borderRadius: 12,
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  modalProductMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#F9FAFB",
  },
  reasonBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reasonBtnActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
  },
  reasonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  reasonTextActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E97A1F",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
