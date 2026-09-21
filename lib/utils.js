function getEnv(name, fallback = undefined) {
    const v = process.env[name];

    return v !== undefined && v !== "" ? v : fallback;
}

async function prompt(question) {
    const readline = require("readline");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const answer = await new Promise((resolve) => rl.question(question, resolve));

    rl.close();

    return answer;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSleep(min, max) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;

    return sleep(ms);
}

module.exports = {
    getEnv,
    prompt,
    sleep,
    randomSleep,
};
