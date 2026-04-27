export async function payAgent(wallet, payment) {
  return wallet.send(payment.payTo, payment.amount);
}
