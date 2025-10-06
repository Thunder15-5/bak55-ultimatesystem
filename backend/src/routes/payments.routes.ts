import { Router } from 'express'
import { initiatePayment, paystackWebhook } from '../controllers/payments.controller'
const router = Router()
router.post('/initiate', initiatePayment)
router.post('/webhook', paystackWebhook)
export default router
