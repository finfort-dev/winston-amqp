'use strict';

const Transport = require('winston-transport');
const amqp = require('amqplib');
const { MESSAGE } = require('triple-beam');

const defaults = {
    level: "info",
    formatter: "",
    url: "amqp://localhost:5672",
    exchange: "logstash",
    queue: "logstash_output",
    appId: "logstash_output",
    contentType: 'application/json',
};

module.exports = class AMQPTransport extends Transport {
    constructor(options) {
        super(options);
        this.options = Object.assign({}, defaults, options);
    }

    async connect() {
        this.connection = await amqp.connect(this.options.url);
        this.channel = await this.connection.createChannel();
        this.exchange = await this.channel.assertExchange(this.options.exchange, 'topic', {
            durable: true
        });

        if (this.options.queue) {
            this.queue = await this.channel.assertQueue(this.options.queue, {
                durable: true
            });
            await this.channel.bindQueue(this.queue.queue, this.exchange.exchange, '*.*');
        }
    }

    log(info, callback = () => {}) {
        this.channel.publish(
            this.exchange.exchange,
            [info.level, this.options.appId].join('.'),
            Buffer.from(info[MESSAGE]),
            {
                persistent: true,
                contentType: this.options.contentType,
            }
        );

        this.emit('logged', info);
        callback();
    }
};