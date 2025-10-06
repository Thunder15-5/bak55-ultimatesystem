import express from 'express'
import cors from 'cors'
import tracksRoutes from './routes/tracks.routes'
import paymentsRoutes from './routes/payments.routes'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/tracks', tracksRoutes)
app.use('/api/payments', paymentsRoutes)

export default app
