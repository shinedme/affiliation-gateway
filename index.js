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

    function urlToAffiliationUrl(url) {
        url = getPathFromUrl(url);
        if (url.startsWith('https://www.amazon.com')) {
            url += '?tag=shinedme-affiliation-provider'
            return url
        } else {
            return false;
        }
    }

    app.get('/', (req, res) => {
        let { url, referer } = req.query;
        console.log(url)
        affiliationUrl = urlToAffiliationUrl(url);
        console.log(affiliationUrl)
        if (affiliationUrl) {
            console.log('valid affiliation url ' + affiliationUrl)
            channel.sendToQueue(queue, Buffer.from(JSON.stringify({ affiliationUrl, referer })), {
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