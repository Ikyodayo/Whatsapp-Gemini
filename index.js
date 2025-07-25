/*
 * Base Simpel
 * Created By Siputzx Production 
 */

const { default: makeWASocket, DisconnectReason, jidDecode, proto, getContentType, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber')

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise((resolve) => { rl.question(text, resolve) })
};

async function startBotz() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const ptz = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    if (!ptz.authState.creds.registered) {
        const phoneNumber = await question('𝙼𝚊𝚜𝚞𝚔𝚊𝚗 𝙽𝚘𝚖𝚎𝚛 𝚈𝚊𝚗𝚐 𝙰𝚔𝚝𝚒𝚏 𝙰𝚠𝚊𝚕𝚒 𝙳𝚎𝚗𝚐𝚊𝚗 𝟼𝟸 :\n')
        let code = await ptz.requestPairingCode(phoneNumber)
        code = code?.match(/.{1,4}/g)?.join("-") || code
        console.log(`𝙲𝙾𝙳𝙴 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 :`, code)
    }

    ptz.ev.on('messages.upsert', async chatUpdate => {
        try {
            let mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return
            if (!ptz.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            let m = smsg(ptz, mek)
            require("./case")(ptz, m, chatUpdate)
        } catch (err) {
            console.error('[ERROR]', err)
        }
    })

    // Setting
    ptz.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    ptz.getName = (jid, withoutContact = false) => {
        let id = ptz.decodeJid(jid)
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = {}
            try { v = await ptz.groupMetadata(id) } catch (e) {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else {
            v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } :
                id === ptz.decodeJid(ptz.user.id) ? ptz.user : {}
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }
    }

    ptz.public = true

    ptz.serializeM = (m) => smsg(ptz, m)
    ptz.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if ([
                DisconnectReason.badSession,
                DisconnectReason.connectionClosed,
                DisconnectReason.connectionLost,
                DisconnectReason.connectionReplaced,
                DisconnectReason.restartRequired,
                DisconnectReason.timedOut
            ].includes(reason)) {
                startBotz()
            } else if (reason === DisconnectReason.loggedOut) {
                console.log('[LOGGED OUT]')
            } else {
                ptz.end(`Unknown DisconnectReason: ${reason}|${connection}`);
            }
        } else if (connection === 'open') {
            console.log('[Connected] ' + JSON.stringify(ptz.user.id, null, 2));
        }
    })

    ptz.ev.on('creds.update', saveCreds)

    ptz.sendText = (jid, text, quoted = '', options) => ptz.sendMessage(jid, { text: text, ...options }, { quoted })

    ptz.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }

    return ptz
}

startBotz()

function smsg(ptz, m) {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = ptz.decodeJid(m.fromMe && ptz.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = ptz.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message.conversation || m.msg.caption || m.msg.text ||
            (m.mtype == 'listResponseMessage' && m.msg.singleSelectReply.selectedRowId) ||
            (m.mtype == 'buttonsResponseMessage' && m.msg.selectedButtonId) ||
            (m.mtype == 'viewOnceMessage' && m.msg.caption) || m.text

        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.sender = ptz.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === ptz.decodeJid(ptz.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.quoted.delete = () => ptz.sendMessage(m.quoted.chat, { delete: { remoteJid: m.quoted.chat, fromMe: m.quoted.fromMe, id: m.quoted.id } })
            m.quoted.download = () => ptz.downloadMediaMessage(m.quoted)
        }
    }
    if (m.msg.url) m.download = () => ptz.downloadMediaMessage(m.msg)
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''
    m.reply = (text, chatId = m.chat, options = {}) =>
        Buffer.isBuffer(text)
            ? ptz.sendMessage(chatId, { document: text, mimetype: 'application/octet-stream', fileName: 'file' }, { quoted: m, ...options })
            : ptz.sendText(chatId, text, m, { ...options })
    return m
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})
