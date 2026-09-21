const path = require('path');
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { handleVerification } = require("./verification");

// Mock Client
const mockClient = {
    sendMessage: async (peer, text) => console.log(`[MockClient] Sending to ${peer}:`, text),
    getInputEntity: async (peer) => ({ id: 123456789, className: "InputUser" }),
    invoke: async (request) => {
        console.log(`[MockClient] Invoked request:`, request.className || request.constructor.name);
        return {
            url: "https://fishid.online/verify?tgWebAppData=mock_data_123&tgWebAppVersion=7.0"
        };
    }
};

// Start Function to Create Button
const createButton = (text) => ({
    text,
    click: async () => console.log(`[MockButton] Clicked button "${text}"`)
});

// Mock Message for Math
const mathMessage = {
    message: `🎣 Verifikasi Keamanan

Kamu sudah mancing beberapa kali.
Jawab pertanyaan berikut untuk melanjutkan:

🔢 VERIFIKASI BOT

Berapa hasil dari:
15 - 5 = ?

⏰ Pilih jawaban dalam 1 menit!`,
    buttons: [
        [createButton("10"), createButton("15"), createButton("20"), createButton("25")]
    ]
};

// Mock Message for Emoji Count
const emojiMessage = {
    message: `🎣 Verifikasi Keamanan

Kamu sudah mancing beberapa kali.
Jawab pertanyaan berikut untuk melanjutkan:

🐟 VERIFIKASI BOT

Hitung berapa ikan:
🐙 🐙 🐙 🐙 🐙 🐙 🐙

⏰ Pilih dalam 1 menit!`,
    buttons: [
        [createButton("5"), createButton("6"), createButton("7"), createButton("8")]
    ]
};

// Mock Message for Sequence
const sequenceMessage = {
    message: `🎣 Verifikasi Keamanan

Kamu sudah mancing beberapa kali.
Jawab pertanyaan berikut untuk melanjutkan:

🧮 VERIFIKASI BOT

Lanjutkan pola:
1, 3, 5, 7, __?

⏰ Pilih dalam 1 menit!`,
    buttons: [
        [createButton("7"), createButton("8"), createButton("9"), createButton("11")]
    ]
};

// Mock Message for Mini App Verification
const miniAppVerificationMessage = {
    id: 99887,
    date: Math.floor(Date.now() / 1000),
    peerId: "mock_bot_peer",
    message: `🔒 Verifikasi Diperlukan

Tap tombol di bawah untuk verifikasi cepat. Setelah berhasil, lanjutkan dengan /mancing.`,
    getInputChat: async () => ({ id: 987654321, className: "InputPeerUser" }),
    buttons: [
        [
            {
                text: "🔒 Verifikasi Sekarang",
                button: {
                    className: "KeyboardButtonWebView",
                    text: "🔒 Verifikasi Sekarang",
                    url: "https://t.me/fish_it_bot/app?startapp=verification_hash_xyz_12345"
                },
                click: async () => console.log(`[MockButton] Clicked WebApp button to open mini app`)
            }
        ]
    ]
};

async function runTests() {
    console.log("--- Testing Math ---");
    await handleVerification(mockClient, "bot", mathMessage);

    console.log("\n--- Testing Emoji Count ---");
    await handleVerification(mockClient, "bot", emojiMessage);

    console.log("\n--- Testing Sequence ---");
    await handleVerification(mockClient, "bot", sequenceMessage);

    console.log("\n--- Testing Mini App Verification ---");
    await handleVerification(mockClient, "bot", miniAppVerificationMessage);
}

runTests();
