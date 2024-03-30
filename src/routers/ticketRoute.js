const Router = require('express')
const { createTicket, getTicket, getTicketByUser } = require('../controllers/ticketController')

const ticketRouter = Router()

ticketRouter.post("/", createTicket)
ticketRouter.get("/", getTicket)
ticketRouter.get("/byUser", getTicketByUser)


module.exports = ticketRouter
