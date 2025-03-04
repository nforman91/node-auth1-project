// Require `checkUsernameFree`, `checkUsernameExists` and `checkPasswordLength`
// middleware functions from `auth-middleware.js`. You will need them here!
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../users/users-model')
const { checkUsernameExists, checkUsernameFree, checkPasswordLength } = require('./auth-middleware')

/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }

  response on username taken:
  status 422
  {
    "message": "Username taken"
  }

  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
 */
router.post(
  '/register', 
  checkUsernameFree, 
  checkPasswordLength, 
  async (req, res, next) => {
  try {
    const { username, password } = req.body
    const hash = bcrypt.hashSync(password, 6)
    const newUser = { username, password: hash }
    const user = await User.add(newUser)
    res.status(201).json(user)
  } catch(err) {
    next(err)
  }
})

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "message": "Welcome sue!"
  }

  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
 */
router.post(
  '/login', 
  checkUsernameExists, 
  async (req, res, next) => {
  try {
    const { password } = req.body
    const passwordCheck = bcrypt.compareSync(password, req.user.password)
    if(passwordCheck) {
      req.session.user = req.user
      res.status(200).json({ message: `Welcome ${req.user.username}!` })
    } else {
      next({ status: 401, message: 'Invalid credentials' })
    }
  } catch(err) {
    next(err)
  }
})

/**
  3 [GET] /api/auth/logout

  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }

  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
 */
router.get('/logout', async (req, res, next) => {
  if (!req.session.user) {
    return res.json({ message: 'no session' })
  }
  req.session.destroy((err) => {
    if(err) {
      return res.json({ message: 'something went wrong' })
    }
    res.status(200).json({ message: 'logged out' })
  })
})
 
// Don't forget to add the router to the `exports` object so it can be required in other modules
module.exports = router
