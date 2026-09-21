const Groq = require('groq-sdk');
const systemPrompt = require('../config/system_prompt');


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


module.exports = async function askGroq(question) {
    const chat = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
        ],
        temperature: 0
    });

    return chat.choices[0].message.content.trim();
};