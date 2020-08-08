const RETRY = 10;
const DELAY = 500;
const BACKOFF = 1.2;

const retry = (retries, fn) => fn().catch(err => retries > 1 ? retry(retries - 1, fn) : Promise.reject(err));
const sleep = (duration) => new Promise(res => setTimeout(res, duration));
const backoff = (retries, fn, delay = DELAY, wait = BACKOFF) =>
    fn().catch(err => retries > 1
        ? sleep(delay).then(() => backoff(retries - 1, fn, delay * wait))
        : Promise.reject(err));

module.exports = { retry, sleep, backoff }