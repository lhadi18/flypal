import express, { Request, Response } from 'express'
import { bucket } from '../services/gcs'
import { parseRoster } from '../parsers'
import pdfParse from 'pdf-parse'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadsDir = path.join('/tmp', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({ storage })

const uploadPdf = async (req: Request, res: Response) => {
  try {
    const filePath = req.file!.path
    const destination = `pdfs/${req.file!.originalname}`

    await new Promise((resolve, reject) => {
      fs.access(filePath, fs.constants.F_OK, err => {
        if (err) return reject(err)
        resolve(null)
      })
    })

    await bucket.upload(filePath, { destination })
    const file = bucket.file(destination)
    const [fileBuffer] = await file.download()

    const pdfData = await pdfParse(fileBuffer)
    fs.unlinkSync(filePath)

    const parsedData = await parseRoster(pdfData.text)
    res.send({ parsedData })
  } catch (error) {
    console.error('Error uploading or reading PDF file:', error)
    res.status(500).send({ error: 'Error uploading or reading PDF file' })
  }
}

export { upload, uploadPdf }
