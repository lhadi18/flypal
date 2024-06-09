import { upload, uploadPdf } from '../controllers/pdf-controller'
import { Router } from 'express'

const router = Router()

router.post('/upload', upload.single('file'), uploadPdf)

export default router
