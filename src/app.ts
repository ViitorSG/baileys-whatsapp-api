import express from 'express'
import errorHandler from './Middlewares/errorHandler'
import whatsappRoutes from './Routes/whatsappRoutes'

const app = express()
app.use(express.json())

app.use('/api/whatsapp', whatsappRoutes)
app.use(errorHandler)

export default app
