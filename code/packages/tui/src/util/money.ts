const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

/** Sub-cent runs are not free, and "$0.00" reads as free. */
export function formatCost(value: number) {
  if (value > 0 && value < 0.01) return "<$0.01"
  return money.format(value)
}
