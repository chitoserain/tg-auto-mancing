const { sleep } = require("../../../lib/utils");
const { checkInventory, processActions, extractAllArtifacts } = require("../utils/actions");

async function cleanInventoryLoop(client, peer) {
    console.log("\n[Inventory Check] Starting Inventory Cleaning Loop...");

    let pageCount = 0;

    while (true) {
        pageCount++;
        console.log(`\n[Inventory Check] Checking Page/Batch #${pageCount}`);

        const { favNums, otherNums, hasArtifacts } = await checkInventory(client, peer);

        if (hasArtifacts) {
            console.log("[Inventory Check] Artifact detected! Pausing check to extract all...");

            await extractAllArtifacts(client, peer);

            console.log("\n[Inventory Check] Extraction done. Restarting inventory check for accuracy...");

            continue;
        }

        const sellNums = otherNums;
        const totalItems = favNums.length + sellNums.length;

        console.log(`[Inventory Check] Found ${totalItems} items.`);

        const actionResult = await processActions(client, peer, { favNums, sellNums });

        if (!actionResult.didChange && totalItems >= 20) {
            console.log("[Inventory Check] Full page contains protected items only. Stopping inventory check.");

            break;
        }

        if (totalItems < 20) {
            console.log("[Inventory Check] Less than 20 items found. Inventory cleared/processed.");

            break;
        }

        console.log("[Inventory Check] 20 items found (Full Page). Continuing to next batch...");
        await sleep(2000);
    }
}

async function runInventoryCheck(client, peer) {
    await cleanInventoryLoop(client, peer);

    console.log("[Inventory Check] Script Finished. Exiting.");

    process.exit(0);
}

module.exports = { runInventoryCheck, cleanInventoryLoop };
