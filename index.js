const winston = require('winston');
const AMQPTransport = require("./lib/amqp_transport");

winston.transports.AMQP = AMQPTransport;
exports.AMQPTransport = AMQPTransport;