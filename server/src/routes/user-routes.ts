import {
  registerUser,
  loginUser,
  validateUserId, getUserDetails, updateUserDetails, updateUserPassword,
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  getAllUsers,
  getMessages,
  sendMessage
} from '../controllers/user-controller'
import express from 'express'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/validateUserId', validateUserId)
router.get('/getUserId', getUserDetails);
router.put('/updateUserId/:id', updateUserDetails)
router.put('/updatePassword/:id', updateUserPassword);
router.get('/getAllUsers/:id', getAllUsers);
router.get('/getUsers', getUsers)
router.delete('/deleteUser/:id', deleteUser)
router.post('/createUser', createUser)
router.put('/updateUser/:id', updateUser)
router.get('/messages/:userId/:recipientId', getMessages);
router.post('/messages', sendMessage);

export default router
