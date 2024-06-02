// import userRoutes from './routes/user-routes'
// import connectDB from './config'
// import express from 'express'
// import dotenv from 'dotenv'
// import https from 'https'
// import cors from 'cors'
// import path from 'path'
// import fs from 'fs'

// dotenv.config()
// connectDB()

// const app = express()
// app.use(cors())
// app.use(express.json())

// app.use('/api/users', userRoutes)

// if (!process.env.SSL_KEY_PATH || !process.env.SSL_CERT_PATH) {
//   throw new Error('SSL_KEY_PATH and SSL_CERT_PATH must be defined in the environment variables')
// }

// const privateKeyPath = path.resolve(process.env.SSL_KEY_PATH)
// const certificatePath = path.resolve(process.env.SSL_CERT_PATH)

// if (!fs.existsSync(privateKeyPath)) {
//   throw new Error(`Private key file not found at path: ${privateKeyPath}`)
// }
// if (!fs.existsSync(certificatePath)) {
//   throw new Error(`Certificate file not found at path: ${certificatePath}`)
// }

// const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
// const certificate = fs.readFileSync(certificatePath, 'utf8')
// const credentials = { key: privateKey, cert: certificate }

// const PORT = process.env.PORT || 9000

// const httpsServer = https.createServer(credentials, app)

// httpsServer.listen(PORT, () => {
//   console.log(`HTTPS Server running on port ${PORT}`)
// })

import userRoutes from './routes/user-routes'
import connectDB from './config'
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import cors from 'cors'

dotenv.config()
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/users', userRoutes)

const PORT = process.env.PORT || 9000

const httpServer = http.createServer(app)

httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`)
})
