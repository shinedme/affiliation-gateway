const express = require('express');
var amqp = require('amqplib');

let app = express()

const port = 5005

async function main() {
    let rabbitmq = await amqp.connect('amqp://localhost')
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
        } else {
            return false;
        }
    }

    app.get('/', (req, res) => {
        let { url, referer } = req.query;
        console.log(url)
        affiliationUrl = urlToAffiliationUrl(url);
        if (affiliationUrl) {
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