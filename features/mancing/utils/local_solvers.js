const fishEmojis = ['🐙', '🦑', '🪼', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭'];


module.exports = {
    solveEmojiCount(text) {
        return Math.max(0, [...text].filter(e => fishEmojis.includes(e)).length - 1);
    },

    solveMath(expr) {
        return Function(`return ${expr.replace('×', '*')}`)();
    }
};