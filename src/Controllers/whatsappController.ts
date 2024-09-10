import crypto from 'crypto'
import { Request, Response } from 'express'
import { setUserToken } from '../Services/authService'
import {
	getLogsService,
	getQRCodeService,
	sendMediaService,
	sendMessageService,
	startSock,
	stopSock
} from '../Services/whatsappService'
import logger from '../Utils/logger'

export const startSocketWhatsApp = async(req: Request, res: Response): Promise<Response> => {
	try {
		await startSock()

		const token = crypto.randomBytes(20).toString('hex')
		console.log('token', token)

		setUserToken(token)

		return res.status(200).send({
			message: 'Conexão com WhatsApp estabelecida com sucesso.',
			token
		})
	} catch(error: any) {
		return res.status(500).send({ message: 'Erro ao gerar QR Code.', error: error.message })
	}
}

export const stopSocketWhatsApp = async(req: Request, res: Response): Promise<Response> => {
	try {
		await stopSock()
		return res.status(200).send({ message: 'Desconectado com sucesso.' })
	} catch(error: any) {
		return res.status(500).send({ message: 'Erro ao desconectar.', error: error.message })
	}
}

export const sendMessage = async(req: Request, res: Response): Promise<Response> => {
	const { jid, message } = req.body

	if(!jid || !message) {
		return res.status(400).send({ message: 'JID e mensagem são obrigatórios.' })
	}

	try {
		const result = await sendMessageService(jid, message)
		return res.status(200).send(result)
	} catch(error: any) {
		return res.status(500).send({ message: 'Erro ao enviar mensagem.', error: error.message })
	}
}

export const sendMedia = async(req: Request, res: Response): Promise<Response> => {
	const { jid, mediaType, mediaPath, caption } = req.body

	if(!jid || !mediaType || !mediaPath) {
		return res.status(400).send({ message: 'JID, tipo de mídia e caminho da mídia são obrigatórios.' })
	}

	try {
		const result = await sendMediaService(jid, mediaType, mediaPath, caption)
		return res.status(200).send(result)
	} catch(error: any) {
		return res.status(500).send({ message: 'Erro ao enviar mídia.', error: error.message })
	}
}

export const getQRCode = async(req: Request, res: Response): Promise<Response> => {
	try {
		const qrCode = await getQRCodeService()
		return res.status(200).send({ message: 'QR Code gerado com sucesso.', qrCode })
	} catch(error: any) {
		return res.status(500).send({ message: 'Erro ao gerar QR Code.', error: error.message })
	}
}

export const getLogsController = async(req: Request, res: Response): Promise<Response> => {
	try {
		const logs = await getLogsService()
		return res.status(200).send({ message: 'Logs obtidos com sucesso', logs })
	} catch(error: any) {
		return res.status(500).send({ message: 'Erro ao obter os logs.', error: error.message })
	}
}
