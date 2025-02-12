import { getPrefix, getCustomResponses, getLevelConfig, getMessageLinksConfig, getAutoPostChannels } from "../../extensions.js";
import Discord from "discord.js";
import Levels from "../../utils/discord-xp.js";
const timer = new Discord.Collection();
//Only 1 command at a time.
const internalCooldown = new Set();

export default async (bot, message, nolevel = false) => {
  if (message.author.bot) return;
  if (message.guild && !message.channel.permissionsFor(bot.user.id)?.has("SEND_MESSAGES")) return;
  try {
    //All-time message code
    if (message.guild) {
      if (message.guild.id === process.env.GUILD_ID && !message.channel.nsfw) {
        if (bot.badwords.isProfane(message.content.toLowerCase()) && (message.channel.parentId !== "621560838041501696")) {
          await message.delete();
          return await message.channel.send(`${message.author}, swearing is not allowed in this server!`);
        }
      }
    } else {
      //Always fetch user
      await message.author.fetch({ cache: true }).catch(() => { });
      //Always fetch author's DM.
      await message.author.createDM().catch(() => { });
    }
    const PREFIX = message.guild ? await getPrefix(message.guild) : "g%";
    if (message.content.startsWith(PREFIX)) {
      if (internalCooldown.has(message.author.id)) return;
      //Command message code
      //Command structure
      //Arguments with spaces
      const args = message.content.substring(PREFIX.length).trimEnd().split(/ +/g);
      if (!args[0]) return;
      const command = bot.commands.get(args[0].toLowerCase()) || bot.commands.find(a => a.aliases.includes(args[0].toLowerCase()));
      if (command) {
        //Always fetch channel
        await message.channel.fetch({ cache: true }).catch(() => { });
        //Always fetch member
        await message.member?.fetch({ cache: true }).catch(() => { });

        if (command.owner && message.author.id !== "577000793094488085") return message.channel.send("Only AndreMor can use this command");
        if (command.dev && message.author.id !== "577000793094488085") {
          if (!process.env.DEVS.split(",").includes(message.author.id)) return message.channel.send("Only Gidget developers can use this command");
        }
        if (!message.guild && command.guildonly) return message.channel.send("This command only works on servers");
        if (command.onlyguild && (message.guild ? message.guild.id !== process.env.GUILD_ID : true)) return message.channel.send("This command only works on Wow Wow Discord");
        if (message.guild) {
          const userperms = message.member.permissions;
          const userchannelperms = message.channel.permissionsFor(message.member.id);
          const botperms = message.guild.me.permissions;
          const botchannelperms = message.channel.permissionsFor(bot.user.id);
          if (message.author.id !== "577000793094488085") {
            if (!userperms.has(command.permissions.user[0])) return message.channel.send("You do not have the necessary permissions to run this command.\nRequired permissions:\n`" + (!(new Discord.Permissions(command.permissions.user[0]).has(8n)) ? (new Discord.Permissions(command.permissions.user[0]).toArray().join(", ") || "None") : "ADMINISTRATOR") + "`");
            if (!userchannelperms.has(command.permissions.user[1])) return message.channel.send("You do not have the necessary permissions to run this command **in this channel**.\nRequired permissions:\n`" + (!(new Discord.Permissions(command.permissions.user[1]).has(8n)) ? (new Discord.Permissions(command.permissions.user[1]).toArray().join(", ") || "None") : "ADMINISTRATOR") + "`");
          }
          if (!botperms.has(command.permissions.bot[0])) return message.channel.send("Sorry, I don't have sufficient permissions to run that command.\nRequired permissions:\n`" + (!(new Discord.Permissions(command.permissions.bot[0]).has(8n)) ? (new Discord.Permissions(command.permissions.bot[0]).toArray().join(", ") || "None") : "ADMINISTRATOR") + "`");
          if (!botchannelperms.has(command.permissions.bot[1])) return message.channel.send("Sorry, I don't have sufficient permissions to run that command **in this channel**.\nRequired permissions:\n`" + (!(new Discord.Permissions(command.permissions.bot[1]).has(8n)) ? (new Discord.Permissions(command.permissions.bot[1]).toArray().join(", ") || "None") : "ADMINISTRATOR") + "`");
        }
        try {
          internalCooldown.add(message.author.id);
          await command.run(bot, message, args);
        } catch (err) {
          if (err.name === "StructureError") return message.channel.send(err.message).catch(() => { });
          console.error(err);
          await message.channel.send("Something happened! Here's a debug: " + err).catch(() => { });
        } finally {
          internalCooldown.delete(message.author.id);
        }
      }
    } else {
      //Non-commands message code
      //For the moment, guild-only things
      if (message.guild) {
        // Autoresponses
        const msgDocument = await getCustomResponses(message.guild);
        if (msgDocument) {
          const { responses } = msgDocument;
          if (responses) {
            const arr = Object.entries(responses);
            for (const i in arr) {
              try {
                const regex = new RegExp(arr[i][0], "gmi");
                if (regex.test(message.content) && message.channel.permissionsFor(bot.user.id).has("SEND_MESSAGES")) {
                  await message.channel.send(arr[i][1]).catch(() => { });
                }
              } catch (_) {
                null;
              }
            }
          }
        }

        // Level system
        if (!nolevel) {
          const msgDocument2 = await getLevelConfig(message.guild);
          if (msgDocument2 && msgDocument2.levelsystem) {
            if (!msgDocument2.nolevel.includes(message.channel.id)) {
              if (!timer.get(message.author.id)) {
                timer.set(message.author.id, true);
                setTimeout(() => timer.delete(message.author.id), 120000);
                const randomAmountOfXp = Math.floor(Math.random() * 9) + 1; // Min 1, Max 10
                const hasLeveledUp = await Levels.appendXp(
                  message.author.id,
                  message.guild.id,
                  randomAmountOfXp
                );
                if (hasLeveledUp) {
                  //Always fetch member
                  await message.member.fetch({ cache: true }).catch(() => { });
                  const user = await Levels.fetch(message.author.id, message.guild.id);
                  const { roles } = msgDocument2;
                  if (roles[user.level - 1]) {
                    const toadd = roles[user.level - 1].filter(e => message.guild.roles.cache.has(e) && message.guild.roles.cache.get(e).editable && !message.guild.roles.cache.get(e).managed)
                    message.member.roles.add(toadd);
                  }
                  if (msgDocument2.levelnotif) await message.channel.send(`${message.author}, congratulations! You have leveled up to **${user.level}**. :tada:`).catch(() => { });
                }

              }
            }
          }
        }

        //Message links system
        const mls = await getMessageLinksConfig(message.guild);
        if (mls && mls.enabled) {
          const regex = /((http|https):\/\/)((www|canary|ptb)\.)?(discordapp|discord)\.com\/channels\/[0-9]{17,20}\/[0-9]{17,20}\/[0-9]{17,20}/gmi;
          const matches = message.content.match(regex);
          if (matches && matches.length) {
            const urlobj = new URL(matches[0]);
            const [channelid, messageid] = urlobj.pathname.split("/").slice(3);
            const channel = bot.channels.cache.get(channelid) || await bot.channels.fetch(channelid).catch(() => { });
            //Always fetch member
            await message.member.fetch({ cache: true }).catch(() => { });
            if (channel && message.guild.id === channel.guild.id && channel.permissionsFor(message.author.id).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]) && channel.permissionsFor(bot.user.id).has(["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"])) {
              const msg = channel.messages.cache.filter(e => !e.partial).get(messageid) || (messageid ? (await channel.messages.fetch(messageid).catch(() => { })) : undefined)
              if (msg) {
                const embed = new Discord.MessageEmbed()
                  .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL({ format: "png", dynamic: true }) })
                  .setDescription(msg.content || "*Without content*")
                  .addField("URL", "[Message Link](" + msg.url + ")", true)
                  .addField("Embeds", msg.embeds.length.toString(), true)
                  .addField("Message flags", msg.flags.toArray().join(", ") || "*Without flags*", true)
                  .addField("Channel", msg.channel.toString())
                  .setFooter({ text: `Mentioned by: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ format: "png", dynamic: true }) });
                if (msg.attachments.first()) embed.setImage(msg.attachments.first().url);
                await message.channel.send({ embeds: [embed] });
              }
            }
          }
        }

        //Autocrossposting
        const acp = await getAutoPostChannels(message.guild);
        if (acp.includes(message.channel.id) && message.channel.type === "GUILD_NEWS") {
          message.crosspost().catch(() => { });
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};
