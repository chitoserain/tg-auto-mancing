const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { getEnv, prompt } = require("./utils");

const SESSION_FILE = path.resolve(__dirname, "../session.txt");

function readSession() {
    if (fs.existsSync(SESSION_FILE)) {
        return fs.readFileSync(SESSION_FILE, "utf8");
    }

    return "";
}

function saveSession(sessionString) {
    fs.writeFileSync(SESSION_FILE, sessionString, "utf8");
}

function makeClient() {
    const apiIdRaw = getEnv("API_ID");
    const apiHash = getEnv("API_HASH");

    if (!apiIdRaw || !apiHash) {
        throw new Error("API_ID dan API_HASH wajib di-set di environment");
    }

    const apiId = Number(apiIdRaw);
    const stringSession = new StringSession(readSession());

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 1000000,
        retryDelay: 3000,
        autoReconnect: true,
    });

    return client;
}

async function ensureLoggedIn(client) {
    const phoneNumberEnv = getEnv("PHONE_NUMBER");
    const passwordEnv = getEnv("TELEGRAM_PASSWORD", "");
    const phoneCodeEnv = getEnv("PHONE_CODE");

    await client.start({
        phoneNumber: async () =>
            phoneNumberEnv ||
            (await prompt("Masukkan nomor telepon (format internasional): ")),
        password: async () =>
            passwordEnv ||
            (await prompt("Masukkan password 2FA (kosong jika tidak ada): ")),
        phoneCode: async () =>
            phoneCodeEnv ||
            (await prompt("Masukkan kode OTP yang dikirim Telegram: ")),
        onError: (err) => {
            console.error("Login error:", err);
        },
    });

    saveSession(client.session.save());
}

module.exports = {
    makeClient,
    ensureLoggedIn,
    readSession,
    saveSession,
};
