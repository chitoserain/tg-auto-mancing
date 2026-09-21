module.exports = function detectType(question) {
    if (/\d+(,\s*\d+)+/.test(question)) return "sequence";
    if (/[🐙🦑🪼🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🦭]/.test(question) && /Hitung/.test(question)) return "emoji_count";
    if (/Pilih emoji/i.test(question)) return "emoji_select";
    if (/[\d]+\s*[+\-×x*]\s*[\d]+/.test(question)) return "math";

    return "unknown";
};