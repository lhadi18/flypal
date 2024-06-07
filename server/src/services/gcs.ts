import { Storage } from '@google-cloud/storage'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID as string
const keyFilename = path.join(__dirname, process.env.GOOGLE_CLOUD_KEYFILE as string)
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME as string

const storage = new Storage({ projectId, keyFilename })
const bucket = storage.bucket(bucketName)

export { storage, bucket }
