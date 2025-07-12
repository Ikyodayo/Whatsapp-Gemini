/*
   * Base Simpel + Gemini AI (Modular)
   * Created By Siputzx Production + Rebot Edit
*/

require("./config")
const fs = require('fs')
const util = require('util')
const axios = require('axios')
const { exec } = require("child_process")
const { getGeminiAi } = require('./lib/gemini') // <-- pastikan file ini ada

module.exports = async (ptz, m) => {
  // Cek pengirim
  const sender = m.key.fromMe
    ? ptz.user.id.split(':')[0] + '@s.whatsapp.net'
    : m.key.participant || m.key.remoteJid

  // Cek apakah pengirim adalah owner
  const isOwner = global.owner
    .map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    .includes(sender)

  if (!isOwner) return // Hanya owner yang bisa pakai perintah, baik di grup atau pribadi

try {
const body = (
(m.mtype === 'conversation' && m.message.conversation) ||
(m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
(m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
(m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
(m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
(m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
(m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
) ? (
(m.mtype === 'conversation' && m.message.conversation) ||
(m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
(m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
(m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
(m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
(m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
(m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
) : '';

const budy = (typeof m.text === 'string') ? m.text : '';
const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
const isCmd = body.startsWith(prefix);
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
const args = body.trim().split(/ +/).slice(1)
const text = q = args.join(" ")
const sender = m.key.fromMe ? (ptz.user.id.split(':')[0]+'@s.whatsapp.net' || ptz.user.id) : (m.key.participant || m.key.remoteJid)
const botNumber = await ptz.decodeJid(ptz.user.id)
const senderNumber = sender.split('@')[0]
const isCreator = (m && m.sender && [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;
const pushname = m.pushName || `${senderNumber}`
const isBot = botNumber.includes(senderNumber)

switch(command) {
case "menu":
case "help":
case "tes":{
m.reply(`
Halo kak ${pushname}, ini adalah base bot dengan fitur AI.

> Menu:
~ .ai [prompt atau reply gambar/teks]
`)
}
break

case "ai": {
if (!text && !(m.quoted && m.quoted.mtype)) return m.reply("Silakan masukkan prompt atau reply gambar/teks.");

let prompt = "";
let mediaData = null;

if (m.quoted && /image/.test(m.quoted.mtype)) {
  const imageBuffer = await ptz.downloadMediaMessage(m.quoted);
  if (imageBuffer) {
    mediaData = imageBuffer.toString('base64');
    prompt = text || (m.quoted.caption ? "Caption: " + m.quoted.caption : "");
  } else {
    return m.reply("Gagal mengambil gambar dari pesan.");
  }
} else if (m.quoted && m.quoted.text) {
  prompt = text + "\n\n" + m.quoted.text;
} else {
  prompt = text;
}

try {
  const result = await getGeminiAi(prompt.trim(), mediaData);
  m.reply(result);
} catch (err) {
  m.reply("❌ Terjadi kesalahan:\n" + err.message);
}
}
break;

default:
if (budy.startsWith('=>')) {
if (!isCreator) return
function Return(sul) {
sat = JSON.stringify(sul, null, 2)
bang = util.format(sat)
if (sat == undefined) {
bang = util.format(sul)
}
return m.reply(bang)
}
try {
m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
} catch (e) {
m.reply(String(e))
}
}

if (budy.startsWith('>')) {
if (!isCreator) return
let kode = budy.trim().split(/ +/)[0]
let teks
try {
teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${q}})()`)
} catch (e) {
teks = e
} finally {
await m.reply(require('util').format(teks))
}
}

if (budy.startsWith('$')) {
if (!isCreator) return
exec(budy.slice(2), (err, stdout) => {
if (err) return m.reply(`${err}`)
if (stdout) return m.reply(stdout)
})
}
}

} catch (err) {
console.log(util.format(err))
}
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update ${__filename}`)
delete require.cache[file]
require(file)
})
