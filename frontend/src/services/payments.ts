export async function initiatePayment(amount: number, email: string){
  const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/payments/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, email })
  })
  return res.json()
}
