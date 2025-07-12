const axios = require('axios');

async function getGeminiAi(textPrompt, imageDataBase64 = null, mimeType = 'image/jpeg') {
  const apiKey = ''; // ISI DENGAN API KEY GEMINI ASLI KAMU
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  let parts = [];
  if (textPrompt) parts.push({ text: textPrompt });
  if (imageDataBase64) {
    parts.push({ inline_data: { mime_type: mimeType, data: imageDataBase64 } });
  }
  if (parts.length === 0) throw new Error("Tidak ada input.");

  try {
    const response = await axios.post(url, { contents: [{ parts }] }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const result = response.data;
    if (
      result?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      return result.candidates[0].content.parts[0].text;
    } else if (result.promptFeedback?.blockReason) {
      return `Respons diblokir. Alasan: ${result.promptFeedback.blockReason}`;
    } else {
      return "Tidak ada respons valid dari AI.";
    }
  } catch (err) {
    console.error("Gemini error:", err);
    throw new Error("Gagal panggil Gemini AI: " + err.message);
  }
}

module.exports = { getGeminiAi };
