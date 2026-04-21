declare module "react-native-razorpay" {
  type RazorpayOpenResult = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  const RazorpayCheckout: {
    open(options: Record<string, unknown>): Promise<RazorpayOpenResult>;
  };

  export default RazorpayCheckout;
}
