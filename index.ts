import { Boom } from '@hapi/boom'
import MiddlewareController from "./controller_middleware"
import dotenv from "dotenv"
import * as fs from "fs"
import AzanNotification from './util/azanNotification';
import makeWASocket, { Browsers, DisconnectReason, makeInMemoryStore, proto, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { group } from 'console';
import convertTel from './util/convertTel';
dotenv.config()
const store = makeInMemoryStore({ 
   
})
store.readFromFile('./baileys_store.json')
setInterval(() => {
    store.writeToFile('./baileys_store.json')
}, 10_000)
if(!fs.existsSync("media")) {
    fs.mkdirSync("media")
}

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
        auth : state,
        getMessage : async(key) => {
            console.log(key)
            const message = await store.loadMessage(key.remoteJid as string, key.id as string)
            return message as proto.IMessage | undefined
        },
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                // || message.templateMessage
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }

            return message;
        },
    })
    store.bind(sock.ev)
    
    
   
    sock.ev.on("creds.update", saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } : any = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    
    sock.ev.on("messages.delete",(m) => {
        console.log(m)
    })
    sock.ev.on("group-participants.update", async(grup) => {
        console.log(grup)
        if(grup.action == "add") {

            const opt = require("./option.json")
            if(opt.newmem == null) return
            const getPesan = opt.newmem[grup.id]
            if(getPesan == null) return
            sock.sendMessage(grup.id, {
                text : getPesan
            })
        } else if(grup.action == "remove") {
            const ppUrl = await sock.profilePictureUrl(grup.author, "image")
            sock.sendMessage(grup.id, { image: { url: ppUrl || "" }, caption:"Selamat Jalan @"+grup.author.split("@").at(0), mentions: grup.participants})
        }
    })
    sock.ev.on('messages.upsert', (m) => {
        
        if(m.type == "append") return
        console.log(JSON.stringify(m, null, 2))
        MiddlewareController(m, sock).catch(err => {
            console.log(err)
        })
    })

}
connectToWhatsApp()