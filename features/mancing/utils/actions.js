const { sendMessage } = require("../../../lib/sender");
const { latestMessageId, waitForAnyText, waitForText } = require("../../../lib/receiver");
const { sleep, randomSleep } = require("../../../lib/utils");
const { parseInventory } = require("./parsing");

const FAVORITE_FULL_RE = /Favorites? penuh/i;
const FAVORITE_SUCCESS_RE = /berhasil|ditambahkan|tersimpan/i;
const GREEN_CIRCLE = "\u{1F7E2}";
const BLUE_CIRCLE = "\u{1F535}";

function getButtonText(button) {
    return String(button?.text ?? button?.button?.text ?? "");
}

function isNumberButton(button) {
    return /^\d+$/.test(getButtonText(button).trim());
}

function isBackButton(button) {
    return /Kembali/i.test(getButtonText(button));
}

function findExtractAllArtifactsButton(buttonRows) {
    const rows = Array.isArray(buttonRows) ? buttonRows : [];
    const allButtons = rows.flat();
    const greenButton = allButtons.find((button) => getButtonText(button).includes(GREEN_CIRCLE));

    if (greenButton) return greenButton;

    const actionRow = rows.find((row) => {
        const buttons = Array.isArray(row) ? row : [row];

        return buttons.some((button) => {
            const text = getButtonText(button);

            return text.includes(GREEN_CIRCLE) || text.includes(BLUE_CIRCLE);
        });
    }) || rows.find((row) => {
        const buttons = Array.isArray(row) ? row : [row];

        return buttons.length > 1 && buttons.every((button) => !isNumberButton(button) && !isBackButton(button));
    });

    if (!actionRow) return null;

    const actionButtons = Array.isArray(actionRow) ? actionRow : [actionRow];

    return actionButtons.find((button) => !getButtonText(button).includes(BLUE_CIRCLE)) || actionButtons[0] || null;
}

async function sendMancing(client, peer) {
    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/mancing");
}

async function checkInventory(client, peer) {
    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/inventory");

    const invMsg = await waitForText(client, peer, /Inventory/i, { timeoutMs: 120000 });

    return parseInventory(invMsg.message || "");
}

async function processActions(client, peer, { favNums = [], sellNums = [] }) {
    const priorityActions = [];
    const successfulFavNums = [];
    const protectedNums = [];

    for (const n of favNums) priorityActions.push({ index: n, type: 'fav' });

    priorityActions.sort((a, b) => b.index - a.index);

    for (let i = 0; i < priorityActions.length; i++) {
        const action = priorityActions[i];
        await randomSleep(2000, 5000);

        if (action.type === 'fav') {
            const sinceId = await latestMessageId(client, peer);

            await sendMessage(client, peer, `/favorite ${action.index}`);

            try {
                const result = await waitForAnyText(client, peer, [FAVORITE_FULL_RE, FAVORITE_SUCCESS_RE], { sinceId, timeoutMs: 15000 });
                const text = result.message || "";

                if (FAVORITE_FULL_RE.test(text)) {
                    protectedNums.push(action.index);

                    console.log(`Skipped Favorite (full, protected from sell): ${action.index}`);

                    const remainingFavNums = priorityActions.slice(i + 1).map((item) => item.index);

                    protectedNums.push(...remainingFavNums);

                    if (remainingFavNums.length > 0) {
                        console.log(`Favorite full. Skipped ${remainingFavNums.length} remaining favorite actions.`);
                    }

                    break;
                } else {
                    successfulFavNums.push(action.index);

                    console.log(`Processed Favorite: ${action.index}`);
                }
            } catch (e) {
                protectedNums.push(action.index);

                console.log(`Favorite result unclear, protected from sell: ${action.index}`);
            }
        }
    }

    const protectedSet = new Set(protectedNums);
    const indicesToSell = sellNums
        .filter((num) => !protectedSet.has(num))
        .map((num) => num - successfulFavNums.filter((favNum) => favNum < num).length)
        .filter((num) => num > 0)
        .sort((a, b) => a - b);

    const sellCount = indicesToSell.length;

    if (sellCount > 0) {
        await randomSleep(2000, 5000);

        const cmd = `/jual ${indicesToSell.join(' ')}`;

        await sendMessage(client, peer, cmd);

        console.log(`Processed Bulk Sell: ${indicesToSell.join(' ')}`);
    }

    return {
        favoriteCount: successfulFavNums.length,
        protectedCount: protectedNums.length,
        soldCount: sellCount,
        didChange: successfulFavNums.length > 0 || sellCount > 0,
    };
}

async function sellAll(client, peer) {
    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/jual semua");

    console.log("Sold all remaining items.");
}

async function extractAllArtifacts(client, peer) {
    console.log(`\n[Extraction] Initiating extraction of all artifacts...`);

    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/extract");

    try {
        const msg = await waitForText(client, peer, /EXTRACT - MATERIALS/i, { timeoutMs: 60000 });

        if (msg && msg.buttons) {
            const allButtons = msg.buttons.flat();
            // Find Inventory button (case-insensitive)
            const inventoryBtn = allButtons.find(btn => btn.text && /Inventory/i.test(btn.text));

            if (inventoryBtn) {
                inventoryBtn.client = client;
                console.log("[Extraction] Clicking 'Inventory' button...");
                await inventoryBtn.click({ sharePhone: false });

                // Wait for the next message "EXTRACT — 📦 Inventory" or matching /EXTRACT.*Inventory/i
                let inventoryMenuMsg = null;
                for (let k = 0; k < 15; k++) {
                    await sleep(2000);
                    const msgs = await client.getMessages(peer, { limit: 1 });
                    if (msgs && msgs.length > 0) {
                        if (/EXTRACT.*Inventory/i.test(msgs[0].message)) {
                            inventoryMenuMsg = msgs[0];
                            break;
                        }
                    }
                }

                if (inventoryMenuMsg && inventoryMenuMsg.buttons) {
                    const greenBtn = findExtractAllArtifactsButton(inventoryMenuMsg.buttons);

                    if (greenBtn) {
                        greenBtn.client = client;
                        console.log("[Extraction] Clicking extract-all-artifacts button...");
                        await greenBtn.click({ sharePhone: false });

                        // Wait for confirmation dialog (checking for KONFIRMASI or Yakin betul)
                        let confirmMsg = null;
                        for (let k = 0; k < 15; k++) {
                            await sleep(2000);
                            const msgs = await client.getMessages(peer, { limit: 1 });
                            if (msgs && msgs.length > 0) {
                                if (/KONFIRMASI|Yakin betul/i.test(msgs[0].message)) {
                                    confirmMsg = msgs[0];
                                    break;
                                }
                            }
                        }

                        if (confirmMsg && confirmMsg.buttons) {
                            const cButtons = confirmMsg.buttons.flat();
                            // Find the confirmation button (contains "Ya, extract")
                            const confirmBtn = cButtons.find(b => b.text && /Ya, extract/i.test(b.text));

                            if (confirmBtn) {
                                confirmBtn.client = client;
                                console.log(`[Extraction] Clicking confirmation button: "${confirmBtn.text}"...`);
                                await confirmBtn.click({ sharePhone: false });
                                console.log("[Extraction] Extraction completed successfully.");
                            } else {
                                console.error("[Extraction] Confirmation button matching 'Ya, extract' not found.");
                            }
                        } else {
                            console.error("[Extraction] Confirmation dialog timed out or no buttons found.");
                        }
                    } else {
                        console.error("[Extraction] '🟢' button not found in Inventory menu.");
                    }
                } else {
                    console.error("[Extraction] Failed to load EXTRACT - Inventory menu.");
                }
            } else {
                console.error("[Extraction] 'Inventory' button not found in main extract menu.");
            }
        } else {
            console.error("[Extraction] No buttons found in main extract menu.");
        }
    } catch (e) {
        console.error(`[Extraction] Error during extraction: ${e.message}`);
    }
}

module.exports = {
    sendMancing,
    checkInventory,
    processActions,
    sellAll,
    extractAllArtifacts,
};
