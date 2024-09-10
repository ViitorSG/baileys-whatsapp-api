// src/controllers/whatsappController.ts
import { NextFunction, Request, Response } from 'express'
import { getUserToken } from '../Services/authService'

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
	const token = req.headers['authorization']

	if(!token) {
		res.status(401).send({ message: 'Token não fornecido.' })
		return
	}

	const userToken = getUserToken()

	if(token !== userToken) {
		res.status(403).send({ message: 'Token inválido.' })
		return
	}

	next()
}
