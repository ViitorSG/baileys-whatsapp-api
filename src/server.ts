import app from './app'

const port = process.env.PORT || 3001
app.listen(port, () => {
	console.log(`API server running on port ${port}`)
})
