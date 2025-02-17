import { WASocket } from '@whiskeysockets/baileys';
import ControllerFunctions, { kategoris } from '../controller_add';
import { messageType } from '../controller_middleware';
import { getOptions } from '../util/option';
export const types = /help/i
export const nama = "Help"
export const kategori = "Tools"
export const bantuan = [
    getOptions()?.prefix+"help"
]
export const isGroup = false
export const isAdmin = false
export default async function Help(socket: WASocket, {
    key,
    fromMe,
    pesan,
    room,
    pengirim_nama,
    pengirim,
    isGroup,
}: messageType) {
    console.log(kategoris)
    const text = Object.keys(kategoris).map(el => {
        let tempText = ""
        tempText = `*${el}*\n`
        kategoris[el].forEach(el2 => {
            tempText += el2+"\n"
        })
        return tempText
    }).join("\n")
    await socket.sendMessage(room, {
        text : `
        *Ini adalah BOT Faisal*
        \n${text}`
    })

}