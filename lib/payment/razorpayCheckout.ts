/**
 * TypeScript entry: Metro still resolves `razorpayCheckout.native` / `.web` at bundle time.
 * This file satisfies `import "./razorpayCheckout"` for tsc.
 */
export { openRazorpaySheet } from "./razorpayCheckout.native";
export type { RazorpaySheetOptions, RazorpaySheetSuccess } from "./razorpayCheckout.native";
