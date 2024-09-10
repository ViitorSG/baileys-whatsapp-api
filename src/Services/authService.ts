let userToken: string | null = null

export const setUserToken = (token: string): void => {
	userToken = token
}

export const getUserToken = (): string | null => {
	return userToken
}
