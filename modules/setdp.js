const {
    MessageType,
    MessageOptions,
    Mimetype,
} = require("@adiwajshing/baileys");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const inputSanitization = require("../sidekick/input-sanitization");
const String = require("../lib/db.js");
const REPLY = String.setdp;

module.exports = {
    name: "setdp",
    description: REPLY.DESCRIPTION,
    extendedDescription: REPLY.EXTENDED_DESCRIPTION,
    demo: { isEnabled: false },
    async handle(client, chat, BotsApp, args) {
        try {
            if (!BotsApp.isGroup) {
                await client.sendMessage(
                    BotsApp.chatId,
                    REPLY.NOT_A_GROUP,
                    MessageType.text
                );
                return;
            }
            if (!BotsApp.isImage && !BotsApp.isReplyImage) {
                await client.sendMessage(
                    BotsApp.chatId,
                    REPLY.NOT_AN_IMAGE,
                    MessageType.text
                );
                return;
            }
            var update = await client.sendMessage(
                BotsApp.chatId,
                REPLY.ICON_CHANGED,
                MessageType.text
            );
            var imageId = chat.key.id;
            const fileName = "./tmp/change_pic" + imageId;
            if (BotsApp.isImage) {
                var filePath = await client.downloadAndSaveMediaMessage(
                    {
                        message: chat.message,
                    },
                    fileName
                );
            } else {
                var filePath = await client.downloadAndSaveMediaMessage(
                    {
                        message:
                            chat.message.extendedTextMessage.contextInfo
                                .quotedMessage,
                    },
                    fileName
                );
            }

            const imagePath = "./tmp/image-" + imageId + ".png";
            ffmpeg(filePath)
                .outputOptions(["-y", "-vcodec png", "-s 500x500"])
                .videoFilters(
                    "scale=2000:2000:flags=lanczos:force_original_aspect_ratio=decrease:eval=frame,format=rgba,pad=2000:2000:(ow-iw)/2:(oh-ih)/2,setsar=1:1"
                )
                .save(imagePath)
                .on("end", async () => {
                    client.updateProfilePicture(
                        BotsApp.chatId,
                        fs.readFileSync(imagePath)
                    );

                    //Image and message deletion
                    inputSanitization.deleteFiles(filePath, imagePath);
                    return await client.deleteMessage(BotsApp.chatId, {
                        id: update.key.id,
                        remoteJid: BotsApp.chatId,
                        fromMe: true,
                    });
                });
        } catch (err) {
            await inputSanitization.handleError(err, client, BotsApp);
        }
        return;
    },
};
