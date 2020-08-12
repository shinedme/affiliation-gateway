const express = require('express');
var amqp = require('amqplib');
const { backoff } = require('./util');

let app = express()

const port = 5005

async function main() {
    let rabbitmq = await backoff(10, () => amqp.connect(`amqp://${process.env.RABBITMQ_HOST || 'localhost'}`))
    let channel = await rabbitmq.createChannel()
    let queue = 'task_queue'
    channel.assertQueue(queue, {
        durable: true
    });

    function getPathFromUrl(url) {
        return url.split(/[?#]/)[0];
    }

    function urlOrigin(url) {
        return new Url(url).origin;
    }

    app.get('/', (req, res) => {
        let { url, urlAppend, to } = req.query;
        console.log(url)
        rawUrl = getPathFromUrl(url);
        affiliationUrl = rawUrl + urlAppend;
        origin = urlOrigin(url)
        if (affiliationUrl) {
            console.log('get affiliation url ' + affiliationUrl)
            channel.sendToQueue(queue, Buffer.from(JSON.stringify({ origin, urlAppend, to })), {
                persistent: true
            });
            res.redirect(affiliationUrl);
        } else {
            res.redirect(url);
        }
    })

    app.listen(port)
}

main()