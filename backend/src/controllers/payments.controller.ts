import { Request, Response } from 'express'
import axios from 'axios'
import { supabaseAdmin } from '../models/db'
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET as string
const PAYSTACK_BASE = 'https://api.paystack.co'

export async function initiatePayment(req: Request, res: Response) {
  const { amount, email, metadata } = req.body
  if (!amount || !email) return res.status(400).json({ error: 'Missing amount or email' })
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      { email, amount: Math.round(amount * 100), metadata },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    )
    return res.json(response.data)
  } catch (err: any) {
    return res.status(500).json({ error: err.response?.data || err.message })
  }
}

export async function paystackWebhook(req: Request, res: Response) {
  const event = req.body
  if (event.event === 'charge.success') {
    const ref = event.data.reference
    await supabaseAdmin.from('payments').insert({
      reference: ref,
      amount: event.data.amount / 100,
      customer_email: event.data.customer?.email,
      status: event.data.status,
      metadata: event.data
    })
  }
  res.sendStatus(200)
}
