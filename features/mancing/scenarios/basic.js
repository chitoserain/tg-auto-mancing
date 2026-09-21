const { waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions, extractAllArtifacts } = require("../utils/actions");
const { cleanInventoryLoop } = require("./inventory_check");
const { handleVerification } = require("../utils/verification");

async function runBasic(client, primaryPeer, backupPeer = null) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;
    const verificationRegex = /Verifikasi (keamanan|Diperlukan)/i;
    const blockedRegex = /AKUN DIBLOKIR SEMENTARA/i;

    const fishingTimes = Number(getEnv("FISHING_TIMES", 4));
    const inventoryCheckCount = Number(getEnv("INVENTORY_CHECK", 1));

    const timeoutMs = Number(getEnv("FISHING_TIMEOUT_MS", 600000));
    const maxRetries = Number(getEnv("MAX_TIMEOUT_RETRIES", 3));

    let currentPeer = primaryPeer;
    let count = 0;
    let timeoutRetries = 0;
    let consecutiveVerifications = 0;

    while (true) {
        count++;

        console.log(`\n[Basic] Mancing #${count} (${currentPeer})`);

        await sendMancing(client, currentPeer);

        try {
            const result = await waitForAnyText(client, currentPeer, [finishRegex, fullRegex, verificationRegex, blockedRegex], { timeoutMs });

            timeoutRetries = 0;

            if (blockedRegex.test(result.message)) {
                console.error("\n[FATAL] AKUN DIBLOKIR SEMENTARA DETECTED! Stopping program.");
                break;
            }

            if (verificationRegex.test(result.message)) {
                consecutiveVerifications++;
                console.log(`[Security] Verification detected (Consecutive: ${consecutiveVerifications}/3)`);
                if (consecutiveVerifications >= 3) {
                    console.error("\n[FATAL] Verification message appeared 3 times consecutively (indicates failure). Stopping program.");
                    break;
                }
                await handleVerification(client, currentPeer, result);
                continue;
            }

            // Reset consecutive verifications on successful fishing result
            consecutiveVerifications = 0;

            if (fullRegex.test(result.message)) {
                console.log("[Basic] Inventory Full detected! Switching to Inventory Cleaning Loop...");

                await cleanInventoryLoop(client, currentPeer);

                continue;
            }

            if (finishRegex.test(result.message)) {
                try {
                    const recentMsgs = await client.getMessages(currentPeer, { limit: 3 });
                    for (const m of recentMsgs) {
                        if (m.media && m.media.className !== 'MessageMediaWebPage' && Math.abs(m.id - result.id) <= 2) {
                            console.log(`[Basic] Special item (GIF) detected! Pinning message for myself...`);
                            await client.pinMessage(currentPeer, m.id, { pmOneside: true });
                            break;
                        }
                    }
                } catch (err) {
                    console.error(`[Basic] Failed to pin message: ${err.message}`);
                }
            }
        } catch (e) {
            timeoutRetries++;

            console.error(`[Basic] Timeout waiting for response (${timeoutMs}ms). Retry ${timeoutRetries}/${maxRetries}...`);

            if (timeoutRetries >= maxRetries) {
                if (backupPeer) {
                    const nextPeer = (currentPeer === primaryPeer) ? backupPeer : primaryPeer;
                    const role = (nextPeer === primaryPeer) ? "Primary" : "Backup";

                    console.log(`[Basic] Max retries reached on ${currentPeer}. Switching to ${role} Bot (${nextPeer})...`);

                    currentPeer = nextPeer;
                    timeoutRetries = 0;

                    continue;
                }

                console.error("[Basic] Max retries reached and no backup available. Stopping program.");

                break;
            }

            continue;
        }

        if (count % fishingTimes === 0) {
            console.log("[Basic] Checking inventory...");

            for (let i = 0; i < inventoryCheckCount; i++) {
                try {
                    const { favNums, otherNums, hasArtifacts } = await checkInventory(client, currentPeer);

                    if (hasArtifacts) {
                        console.log("[Basic] Artifact detected! Pausing check to extract all...");

                        await extractAllArtifacts(client, currentPeer);

                        console.log("[Basic] Extraction done. Restarting inventory check for accuracy...");

                        i--;

                        continue;
                    }

                    const totalItems = favNums.length + otherNums.length;
                    const actionResult = await processActions(client, currentPeer, { favNums, sellNums: otherNums });

                    if (!actionResult.didChange && totalItems >= 20) {
                        console.log("[Basic] Full inventory page contains protected items only. Skipping remaining checks.");

                        break;
                    }
                } catch (e) {
                    console.error(`[Basic] Error during inventory check: ${e.message}. Skipping this check.`);
                }

                if (inventoryCheckCount > 1) await sleep(2000);
            }
        } else {
            console.log(`[Basic] Mancing finished. Next cast immediately.`);
        }
    }
}

module.exports = { runBasic };
