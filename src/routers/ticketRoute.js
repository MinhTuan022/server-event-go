const Router = require('express')
const { createTicket, getAllTicket } = require('../controllers/ticketController')

const ticketRouter = Router()

ticketRouter.post("/", createTicket)
ticketRouter.get("/", getAllTicket)


module.exports = ticketRouter
