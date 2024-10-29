import { getAllRoles } from '../controllers/role-controller'
import express from 'express'

const router = express.Router()

router.get('/getAllRoles', getAllRoles)

export default router
