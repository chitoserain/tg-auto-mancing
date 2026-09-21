const { getEnv, prompt } = require("../../lib/utils");
const { runBasic } = require("./scenarios/basic");
const { runVIP } = require("./scenarios/vip");
const { runInventoryCheck } = require("./scenarios/inventory_check");
const { runBuyUmpan } = require("./scenarios/buy_umpan");

async function run(client) {
    const peer = await selectBot();

    console.log('\nPilih Skenario Mancing:');
    console.log('1. Basic');
    console.log('2. VIP');
    console.log('3. Inventory Check');
    console.log('4. Beli Umpan');

    const choice = await prompt('Pilih skenario (1-4): ');

    if (choice.trim() === '1') {
        await runBasic(client, peer.primary, peer.backup);
    } else if (choice.trim() === '2') {
        const useBoostInput = await prompt("Gunakan Boost Strategy? (y/n): ");
        const useBoost = useBoostInput.toLowerCase() === 'y';

        await runVIP(client, peer.primary, peer.backup, useBoost);
    } else if (choice.trim() === '3') {
        await runInventoryCheck(client, peer.primary);
    } else if (choice.trim() === '4') {
        await runBuyUmpan(client, peer.primary);
    } else {
        console.log("Pilihan tidak valid.");
    }
}

async function selectBot() {
    const peerEnv = getEnv("BOT_PEER");

    if (!peerEnv) {
        const manualPeer = await prompt("Masukkan username bot/peer: ");

        return { primary: manualPeer, backup: null };
    }

    const bots = peerEnv.split(',').map(b => b.trim()).filter(b => b);

    if (bots.length === 0) {
        const manualPeer = await prompt("Masukkan username bot/peer: ");

        return { primary: manualPeer, backup: null };
    }

    if (bots.length === 1) {
        return { primary: bots[0], backup: null };
    }

    console.log('\nPilih Bot UTAMA:');

    bots.forEach((bot, index) => {
        console.log(`${index + 1}. ${bot}`);
    });

    const choice = await prompt(`Pilih bot utama (1-${bots.length}): `);
    const index = Number(choice) - 1;
    let primary = bots[0];

    if (index >= 0 && index < bots.length) {
        primary = bots[index];
    } else {
        console.log("Pilihan tidak valid, menggunakan bot pertama sebagai UTAMA.");
    }

    const availableBackups = bots;

    if (availableBackups.length > 0) {
        console.log('\nPilih Bot CADANGAN (Opsional):');
        console.log('0. Tidak ada');

        availableBackups.forEach((bot, i) => {
            console.log(`${i + 1}. ${bot}`);
        });

        const backupChoice = await prompt(`Pilih bot cadangan (0-${availableBackups.length}): `);
        const backupIndex = Number(backupChoice) - 1;

        if (backupIndex >= 0 && backupIndex < availableBackups.length) {
            return { primary, backup: availableBackups[backupIndex] };
        }
    }

    return { primary, backup: null };
}

module.exports = { run };
