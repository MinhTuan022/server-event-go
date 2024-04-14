const Router = require('express')
const { getTicket } = require('../controllers/ticketController')


const ticketRouter = Router()

ticketRouter.get("/", getTicket)

module.exports = ticketRouter
