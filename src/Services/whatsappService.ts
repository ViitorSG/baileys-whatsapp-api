// src/service/whatsappService.js
import { Boom } from '@hapi/boom'
import fs from 'fs/promises'
import path from 'node:path'
import P from 'pino'
import qrcode from 'qrcode'
import { DisconnectReason, makeWASocket } from '../index'
import { delay, useMultiFileAuthState } from '../Utils'

const logPath = path.resolve(__dirname, '..', '..', 'wa-logs.txt')
const logger = P({
	level: 'trace',
	timestamp: () => `,"time":"${new Date().toISOString()}"`,
}, P.destination(logPath))
logger.level = 'trace'
let sock: any = null
let qrCodeBase64: any = null

export const startSock = async() => {
	const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

	sock = makeWASocket({
		auth: state,
		logger
	})

	sock.ev.on('connection.update', (update) => {
		const { connection, qr, lastDisconnect } = update
		const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode

		if(qr) {
			qrcode.toDataURL(qr, (err, url) => {
				if(err) {
					logger.error('Erro ao gerar QR code em base64:', err)
				} else {
					qrCodeBase64 = url
					logger.info('QR Code gerado e armazenado em base64.')
					console.log('QR Code gerado e armazenado em base64.')
				}
			})
		}

		if(connection === 'open') {
			logger.info('Conexão com o WhatsApp estabelecida!')
			console.log('Conexão com o WhatsApp estabelecida!')
		}


		if(connection === 'close') {
			handleDisconnection(statusCode)
		}
	})
	sock.ev.on('creds.update', saveCreds)
	sock.ev.on('messages.upsert', async({ messages, type }) => {
		console.log(`Novo evento de mensagem: ${type}`)
		logger.info(`Novo evento de mensagem: ${type}`)

		if(type === 'notify') {
			for(const msg of messages) {
				const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
				const from = msg.key.remoteJid
				console.log(`Nova mensagem de ${from}: ${text}`)
				logger.info(`Nova mensagem de ${from}: ${text}`)
			}
		}
	})
	sock.ev.on('presence.update', (update) => {
		console.log(`Atualização de presença: ${update.id}, status: ${update.presence}`)
		logger.info(`Atualização de presença: ${update.id}, status: ${update.presence}`)
	})
	sock.ev.on('message-receipt.update', (update) => {
		console.log('Atualização de recibo de mensagem:', update)
		logger.info('Atualização de recibo de mensagem:', update)
	})

	return sock
}

const handleDisconnection = (statusCode?: number) => {
	switch (statusCode) {
	case DisconnectReason.restartRequired:
		logger.warn('Reinício necessário, reconectando...')
		startSock()
		break
	case DisconnectReason.connectionLost:
		logger.warn('Conexão perdida, reconectando...')
		startSock()
		break
	case DisconnectReason.loggedOut:
		logger.info('Usuário deslogado.')
		break
	case DisconnectReason.connectionReplaced:
		logger.warn('Conexão substituída.')
		break
	case DisconnectReason.timedOut:
		logger.warn('Conexão expirou. Tentando reconectar...')
		startSock()
		break
	default:
		logger.error(`Conexão fechada: ${statusCode}`)
	}
}

export const stopSock = async() => {
	if(sock) {
		await sock.end()
		console.log('Conexão encerrada.')
		logger.info('Conexão encerrada.')
	}
}


export const sendMessageService = async(jid, message) => {
	if(!sock) {
		throw new Error('Socket de WhatsApp não inicializado')
	}

	try {
		await sock.presenceSubscribe(jid)
		await delay(500)
		await sock.sendPresenceUpdate('composing', jid)
		await delay(2000)
		await sock.sendPresenceUpdate('paused', jid)
		await sock.sendMessage(jid, { text: message })

		console.log(`Mensagem enviada para ${jid}: ${message}`)
		logger.info(`Mensagem enviada para ${jid}: ${message}`)

		return { status: 'Mensagem enviada com sucesso!' }
	} catch(error) {
		logger.error('Erro ao enviar mensagem:', error)
		console.log('Erro ao enviar mensagem:', error)
		throw new Error('Erro ao enviar a mensagem')
	}
}

export const sendMediaService = async(jid, mediaType, mediaPath, caption = '') => {
	if(!sock) {
		throw new Error('Socket de WhatsApp não inicializado')
	}

	try {
		let messageOptions = {}

		switch (mediaType) {
		case 'image':
			messageOptions = { image: { url: mediaPath }, caption }
			break
		case 'video':
			messageOptions = { video: { url: mediaPath }, caption }
			break
		case 'document':
			messageOptions = { document: { url: mediaPath }, caption }
			break
		default:
			throw new Error('Tipo de mídia não suportado')
		}

		await sock.sendMessage(jid, messageOptions)

		console.log(`Mídia ${mediaType} enviada para ${jid} com sucesso!`)
		logger.info(`Mídia ${mediaType} enviada para ${jid} com sucesso!`)

		return { status: 'Mídia enviada com sucesso!' }
	} catch(error) {
		logger.error('Erro ao enviar mídia:', error)
		console.log('Erro ao enviar mídia:', error.message)
		throw new Error(`Erro ao enviar mídia: ${error.message}`)
	}
}

export const getQRCodeService = async() => qrCodeBase64

export const getLogsService = async(): Promise<object[]> => {
	try {
		console.log('Verificando existência do arquivo de logs...')

		try {
			await fs.access(logPath)
		} catch{
			console.log('Arquivo de log não encontrado.')
			throw new Error('Arquivo de log não encontrado')
		}

		console.log('Lendo arquivo de log...')

		// Lê o conteúdo do arquivo de log de forma assíncrona
		const logs = await fs.readFile(logPath, 'utf8')

		// Separa os logs por linha e parseia para JSON
		const logEvents = logs.split('\n').filter(line => line).map(line => {
			try {
				return JSON.parse(line)
			} catch(error) {
				console.log('Erro ao parsear uma linha do log:', error)
				return null // Ignora linhas inválidas
			}
		}).filter(event => event !== null) // Remove os valores nulos

		console.log('Logs lidos e parseados:', logEvents)
		return logEvents
	} catch(error) {
		console.log('Erro ao obter logs:', error)
		logger.error('Erro ao obter logs:', error)
		throw new Error(`Erro ao obter logs: ${error.message}`)
	}
}