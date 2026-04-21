/** Inline HTML for Razorpay Standard Checkout inside a WebView (Expo Go / no native module). */
export function buildRazorpayCheckoutHtml(params: {
  key: string;
  orderId: string;
  amount: string;
  currency: string;
}): string {
  const key = JSON.stringify(params.key);
  const orderId = JSON.stringify(params.orderId);
  const amount = JSON.stringify(params.amount);
  const currency = JSON.stringify(params.currency);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
</head>
<body style="margin:0;background:#fff;">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    (function () {
      function send(obj) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        }
      }
      function start() {
        if (typeof Razorpay === "undefined") {
          setTimeout(start, 80);
          return;
        }
        try {
          var options = {
            key: ${key},
            amount: ${amount},
            currency: ${currency},
            order_id: ${orderId},
            name: "Order payment",
            description: "Complete your payment",
            handler: function (response) {
              send({
                type: "success",
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
            },
            modal: {
              ondismiss: function () {
                send({ type: "dismiss" });
              }
            },
            theme: { color: "#ef7b1a" }
          };
          new Razorpay(options).open();
        } catch (e) {
          send({ type: "error", message: String(e && e.message ? e.message : e) });
        }
      }
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start);
    })();
  </script>
</body>
</html>`;
}
