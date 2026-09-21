async function sendMessage(client, peer, text) {
    if (!peer) throw new Error('Peer/username/chat wajib diisi');
    if (!text) throw new Error('Pesan tidak boleh kosong');

    await client.sendMessage(peer, { message: text });
}

module.exports = {
    sendMessage,
};
