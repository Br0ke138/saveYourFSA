const ccxt = require('ccxt');
const moment = require('moment');

// --------------------------
// Configure

// instantiate the exchange
let coss = new ccxt.coss({
    apiKey: "",
    secret: "",
});
const pair = 'COS/ETH';

// ---------------------------


let ordersToPlace = [];
const now = moment().utc()

async function start() {
    await waitForFSA();
    await cancelSellOrders();
    await timeout(10 * 60 * 1000 + getRandomSeconds(60 * 5));
    await placeOrders();
    start();
}

async function waitForFSA() {
    if (now.hour() < 2 || (now.hour === 2 && now.minute < 46)) {
        let then = now.clone()
        then.hour(2);
        then.minute(45);
        await timeout(then.diff(now));
    } else {
        let then = now.clone();
        then.add(1, 'd');
        then.hour(2);
        then.minute(45);
        await timeout(then.diff(now));
    }
}

function getRandomSeconds(max) {
    return Math.floor(Math.random() * Math.floor(max)) * 60 * 1000;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

start();

async function cancelSellOrders() {
    ordersToPlace = [];
    const openOrders = await tryCatch(fetchOpenOrdersWithRetry());
    if (openOrders.success) {
        for (let i = 0; i < openOrders.result.length; i++) {
            orders.push({
                price: openOrders.result[i].price,
                amount: openOrders.result[i].amount
            });

            await cancelOrderWithRetry(openOrders.result[i].id);
        }
    }
}

async function placeOrders() {
    for (let i = 0; i < ordersToPlace; i++) {
        await placeSellOrderWithRetry(ordersToPlace[i].price, ordersToPlace[i].amount);
    }
}

// Place a sell limit Order
async function placeSellOrderWithRetry(price, amount, retries = 5) {
    return new Promise(async (resolve, reject) => {
        for (let i = 1; i <= retries; i++) {
            const order = await tryCatch(coss.createLimitSellOrder(config.pair, amount, price));
            if (order.success && order.result['id']) {
                resolve(order.result);
                return;
            }
        }
        reject('Unable to place sell Order with price: ' + price + ' and amount: ' + amount);
    })
}


async function tryCatch(promise) {
    return promise
        .then(result => ({success: true, result}))
        .catch(error => ({success: false, error}))
}

async function fetchOpenOrdersWithRetry(retries = 5) {
    return new Promise(async (resolve, reject) => {
        for (let i = 1; i <= retries; i++) {
            const openOrders = await tryCatch(coss.fetchOpenOrders(pair));
            if (openOrders.success) {
                resolve(openOrders.result);
                return;
            } else {
                console.log(openOrders);
            }
        }
        reject('Unable to fetch open Orders');
    })
}

async function cancelOrderWithRetry(id, retries = 5) {
    return new Promise(async (resolve, reject) => {
        for (let i = 1; i <= retries; i++) {
            const order = await tryCatch(coss.cancelOrder(id, pair));
            if (order.success && order.result['id']) {
                resolve('Order canceled');
                return;
            }
        }
        reject('Unable to cancel order with id: ' + id);
    })
}
