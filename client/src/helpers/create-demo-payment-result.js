export function createDemoPaymentResult(orderId, userInfo) {
  return {
    id: orderId,
    update_time: new Date().toISOString(),
    status: "success",
    payer: {
      email_address: userInfo.email,
    },
  };
}
