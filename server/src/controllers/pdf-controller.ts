import express, { Request, Response } from 'express'
import { parseInput, Duty } from '../utils/parser'
import { bucket } from '../services/gcs'
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

    // Wait until the file is fully written to disk
    await new Promise((resolve, reject) => {
      fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
          return reject(err)
        }
        resolve(null)
      })
    })

    // Upload file to Google Cloud Storage
    await bucket.upload(filePath, {
      destination
    })

    console.log(`File uploaded to ${destination}`)

    // Get the file from the bucket
    const file = bucket.file(destination)
    const [fileBuffer] = await file.download()

    // Parse the PDF
    const data = await pdfParse(fileBuffer)
    // Clean up the uploaded file from the local storage
    fs.unlinkSync(filePath)

    const text = data.text
    const pattern = /AIR ASIA[\s\S]*?(?=Total Hours and Statistics)/
    const match = text.match(pattern)

    if (match) {
      const parsedData: Duty[] = parseInput(match[0].split('\n')) // Split the matched text into lines and parse it
      console.log(parsedData)
      res.send({ text: data.text, parsedData })
    } else {
      res.send({ text: data.text })
    }
  } catch (error) {
    console.error('Error uploading or reading PDF file:', error)
    res.status(500).send({ error: 'Error uploading or reading PDF file' })
  }
}

export { upload, uploadPdf }
