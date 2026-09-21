const { sleep } = require("./utils");

async function readMessages(client, peer, limit = 10) {
    if (!peer) throw new Error('Peer/username/chat wajib diisi');

    const messages = [];

    for await (const m of client.iterMessages(peer, { limit })) {
        messages.push({ id: m.id, date: m.date, fromId: m.fromId, text: m.message });
    }

    return messages;
}

async function latestMessageId(client, peer) {
    let latest = 0;

    for await (const m of client.iterMessages(peer, { limit: 1 })) {
        latest = m.id || 0;
    }

    return latest;
}

async function waitForText(client, peer, regex, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 180000;
    const pollIntervalMs = opts.pollIntervalMs ?? 2000;
    const botUsername = opts.botUsername ?? undefined;
    let botId = null;

    if (botUsername) {
        const bot = await client.getEntity(botUsername);
        botId = bot.id;
    }

    const start = Date.now();
    let seenTop = opts.sinceId || await latestMessageId(client, peer);

    while (Date.now() - start < timeoutMs) {
        const ids = [];

        for await (const m of client.iterMessages(peer, { limit: 5 })) {
            ids.push(m.id || 0);

            if (botId != null) {
                const from = m.fromId || {};
                const uid = from.userId || from.channelId || from.chatId || null;

                if (uid == null || String(uid) !== String(botId)) continue;
            }

            if ((m.id || 0) > seenTop && typeof m.message === 'string' && regex.test(m.message)) {
                return m;
            }
        }

        if (ids.length) {
            const maxId = Math.max(...ids);

            if (maxId > seenTop) seenTop = maxId;
        }

        await sleep(pollIntervalMs);
    }

    throw new Error('Timeout menunggu pesan sesuai');
}

async function waitForAnyText(client, peer, regexes, opts = {}) {
    const timeoutMs = opts.timeoutMs ?? 180000;
    const pollIntervalMs = opts.pollIntervalMs ?? 2000;
    const botUsername = opts.botUsername ?? undefined;
    let botId = null;

    if (botUsername) {
        const bot = await client.getEntity(botUsername);

        botId = bot.id;
    }

    const start = Date.now();
    let seenTop = opts.sinceId || await latestMessageId(client, peer);

    while (Date.now() - start < timeoutMs) {
        const ids = [];

        for await (const m of client.iterMessages(peer, { limit: 5 })) {
            ids.push(m.id || 0);

            if (botId != null) {
                const from = m.fromId || {};
                const uid = from.userId || from.channelId || from.chatId || null;

                if (uid == null || String(uid) !== String(botId)) continue;
            }

            if ((m.id || 0) > seenTop && typeof m.message === 'string' && regexes.some((r) => r.test(m.message))) {
                return m;
            }
        }

        if (ids.length) {
            const maxId = Math.max(...ids);

            if (maxId > seenTop) seenTop = maxId;
        }

        await sleep(pollIntervalMs);
    }

    throw new Error('Timeout menunggu salah satu pesan sesuai');
}

async function resolveEntityById(client, idString) {
    if (!idString) throw new Error('GROUP_ID wajib diisi');

    const id = BigInt(String(idString));
    const entity = await client.getEntity(id);

    return entity;
}

async function readGroupMessages(client, groupId, limit = 10, opts = {}) {
    const entity = await resolveEntityById(client, groupId);
    const botUsername = opts.botUsername || process.env.BOT_PEER || undefined;
    let botId = null;

    if (botUsername) {
        const bot = await client.getEntity(botUsername);

        botId = bot.id;
    }

    const messages = [];

    for await (const m of client.iterMessages(entity, { limit })) {
        if (botId != null) {
            const from = m.fromId || {};
            const uid = from.userId || from.channelId || from.chatId || null;

            if (uid == null) continue;
            if (String(uid) !== String(botId)) continue;
        }

        messages.push({ id: m.id, date: m.date, fromId: m.fromId, text: m.message });
    }

    return messages;
}

module.exports = {
    readMessages,
    readGroupMessages,
    waitForText,
    waitForAnyText,
    latestMessageId,
};
