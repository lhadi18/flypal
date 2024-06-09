import {
  registerUser,
  loginUser,
  validateUserId,
  getUsers,
  deleteUser,
  createUser,
  updateUser
} from '../controllers/user-controller'
import express from 'express'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/validateUserId', validateUserId)
router.get('/getUsers', getUsers)
router.delete('/deleteUser/:id', deleteUser)
router.post('/createUser', createUser)
router.put('/updateUser/:id', updateUser)

export default router
