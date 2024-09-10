import { Router } from 'express'
import {
	getLogsController,
	getQRCode,
	sendMedia,
	sendMessage,
	startSocketWhatsApp,
	stopSocketWhatsApp
} from '../Controllers/whatsappController'
import { verifyToken } from '../Middlewares/verifyToken'

const router = Router()

router.get('/start-socket', (req, res, next) => {
	console.log('Chamando rota /start-socket')
	next()
}, startSocketWhatsApp)
router.get('/get-qr-code', verifyToken, getQRCode)
router.get('/logs', verifyToken, getLogsController)
router.post('/stop-socket', verifyToken, stopSocketWhatsApp)
router.post('/send-message', verifyToken, sendMessage)
router.post('/send-media', verifyToken, sendMedia)

export default router