const { exec } = require("child_process");
const { Api } = require("telegram");
const detectType = require("./detect_type");
const { solveMath, solveEmojiCount } = require("./local_solvers");
const askGroq = require("../../../services/groq_client");
const { sleep } = require("../../../lib/utils");

async function handleVerification(client, peer, message) {
    console.log(`\n[Security] Verification detected!`);

    const text = message.message || "";

    if (text.toLowerCase().includes("verifikasi diperlukan")) {
        await clickButtonByText(client, message, "Verifikasi Sekarang", false);

        const isTest = process.env.NODE_ENV === "test";
        const sleepDuration = isTest ? 10 : 30000;
        console.log(`[Security] Waiting ${sleepDuration}ms after clicking mini app verification...`);
        await sleep(sleepDuration);
        return;
    }

    const type = detectType(text);
    console.log(`[Security] Type detected: ${type}`);

    let answer = null;

    try {
        if (type === "math") {
            const match = text.match(/([\d]+\s*[+\-Ã—x*]\s*[\d]+)/);
            if (match) {
                answer = solveMath(match[0]);
            } else {
                console.log("[Security] math detected but regex failed to extract, trying Groq fallback.");
                answer = await askGroq(text);
            }
        } else if (type === "emoji_count") {
            answer = solveEmojiCount(text);
        } else {
            console.log(`[Security] Using AI solver for ${type}...`);
            answer = await askGroq(text);
        }

        console.log(`[Security] Solved Answer: ${answer}`);

        if (answer === null || answer === undefined) {
            console.error("[Security] Failed to find an answer.");
            return;
        }

        await clickButtonByText(client, message, String(answer));
    } catch (e) {
        console.error(`[Security] Error solving: ${e.message}`);
    }
}

async function clickButtonByText(client, message, answerText, exactMatch = true) {
    if (!message.buttons) {
        console.log("[Security] No buttons found in message.");
        return;
    }

    const flatButtons = message.buttons.flat();

    const targetButton = flatButtons.find(btn => {
        const btnText = btn.text ? btn.text.toString().trim() : "";
        const targetText = answerText.toString().trim();
        return exactMatch ? btnText === targetText : btnText.includes(targetText);
    });

    if (targetButton) {
        console.log(`[Security] Clicking button: "${targetButton.text}"`);

        const btnRaw = targetButton.button || {};
        const className = btnRaw.className || btnRaw.constructor.name || "";

        if (className === "KeyboardButtonWebView" || className === "KeyboardButtonSimpleWebView") {
            try {
                console.log(`[Security] Requesting authenticated Web App URL for: "${targetButton.text}"...`);
                const chat = await message.getInputChat();
                const bot = await client.getInputEntity(message.fromId || message.peerId);

                const result = await client.invoke(
                    new Api.messages.RequestWebView({
                        peer: chat,
                        bot: bot,
                        url: btnRaw.url,
                        platform: "android",
                    })
                );

                const webAppUrl = result.url;
                // console.log(`[Security] Authenticated Web App URL retrieved: ${webAppUrl}`);
                // console.log(`[Security] Opening Web App in your default browser...`);
                exec(`start "" "${webAppUrl}"`, (err) => {
                    if (err) {
                        console.error(`[Security] Failed to open browser: ${err.message}`);
                    } else {
                        // console.log(`[Security] Browser opened successfully.`);
                    }
                });
            } catch (err) {
                console.error(`[Security] Error requesting Web App URL: ${err.message}`);
            }
        } else {
            if (!targetButton.client) {
                targetButton.client = client;
            }

            await targetButton.click({ sharePhone: false });
        }
    } else {
        console.log(`[Security] Button with text "${answerText}" not found. Available buttons:`);
        flatButtons.forEach(b => process.stdout.write(`[${b.text}] `));
        console.log("");
    }
}

module.exports = { handleVerification };
