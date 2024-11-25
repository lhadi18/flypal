import {
  registerUser,
  loginUser,
  validateUserId,
  getUserDetails,
  updateUserDetails,
  updateUserPassword,
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  friendRequest,
  friendList,
  addFriend,
  acceptRequest,
  removeFriend,
  declineRequest,
  getNonFriends,
  upload,
  uploadProfilePicture
} from '../controllers/user-controller'
import express from 'express'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/validateUserId', validateUserId)
router.get('/getUserId', getUserDetails)
router.put('/updateUserId/:id', updateUserDetails)
router.put('/updatePassword/:id', updateUserPassword)
router.post('/friendRequest', friendRequest)
router.get('/getUsers', getUsers)
router.delete('/deleteUser/:id', deleteUser)
router.post('/createUser', createUser)
router.put('/updateUser/:id', updateUser)
router.get('/friendList/:id', friendList)
router.get('/addFriend/:id', addFriend)
router.post('/acceptRequest', acceptRequest)
router.post('/removeFriend', removeFriend);
router.post('/declineRequest', declineRequest);
router.get('/nonFriends/:id', getNonFriends);
router.put('/updateProfilePicture/:userId', upload.single('profilePicture'), uploadProfilePicture)

export default router
