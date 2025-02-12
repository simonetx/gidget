import Discord from 'discord.js';
import getPremiumType from '../../utils/detectnitro.js';

export default class extends SlashCommand {
  constructor(options) {
    super(options);
    this.deployOptions.type = 'USER';
    this.permissions = {
      user: [0n, 0n],
      bot: [0n, 16384n]
    };
  }
  async run(bot, interaction) {
    /*
    const status = {
      online: "Online",
      idle: "Idle",
      dnd: "Do Not Disturb",
      offline: "Offline/Invisible"
    };
    const desktop = {
      online: "Desktop => Online",
      idle: "Desktop => Idle",
      dnd: "Desktop => Do Not Disturb"
    };
    const web = {
      online: "Web => Online",
      idle: "Web => Idle",
      dnd: "Web => Do Not Disturb"
    };
    const mobile = {
      online: "Mobile => Online",
      idle: "Mobile => Idle",
      dnd: "Mobile => Do Not Disturb"
    };
    const ptype = {
      PLAYING: "Playing ",
      LISTENING: "Listening ",
      WATCHING: "Watching ",
      STREAMING: "Streaming ",
      CUSTOM_STATUS: "Custom status:"
    };
    */
    let user = bot.users.cache.get(interaction.targetId);
    if (!user) {
      try {
        const fetch = await bot.users.fetch(interaction.targetId);
        user = fetch;
        if (!user) return interaction.reply({ content: "Invalid member!", ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: "Invalid member!", ephemeral: true });
      }

    }
    const premiumtext = ["Without Nitro", "Nitro Classic", "***Nitro***"];
    const thing = !user.bot ? (await getPremiumType(user)) : undefined;
    let finaltext = "";
    if (!user.bot) {
      if (thing.value < 0) finaltext = "[*I don't know*](https://gidget.andremor.dev/api/auth/)";
      else if (thing.type === "db") finaltext = premiumtext[thing.value] + " (DB)";
      else finaltext = premiumtext[thing.value];
    }
    /*
    const status2 = "";
    if (user.presence.clientStatus) {
      if (user.presence.clientStatus["web"]) {
        status2 += web[user.presence.clientStatus["web"]] + "\n";
      }
      if (user.presence.clientStatus["mobile"]) {
        status2 += mobile[user.presence.clientStatus["mobile"]] + "\n";
      }
      if (user.presence.clientStatus["desktop"]) {
        status2 += desktop[user.presence.clientStatus["desktop"]] + "\n";
      }
    } else {
      status2 = status[user.presence.status];
    }
    if (!status2)
      status2 = "Offline/Invisible";
    var ptext = "";
    if (user.presence.activities && user.presence.activities[0]) {
      for (const npresence of Object.values(user.presence.activities)) {
        if (npresence.type == "CUSTOM_STATUS") {
          ptext += ptype[npresence.type] + "\n";
          if (npresence.emoji)
            ptext += npresence.emoji.toString() + " ";
          if (npresence.state)
            ptext += npresence.state;
          ptext += "\n";
        } else {
          ptext += ptype[npresence.type] + npresence.name;
          if (npresence.details) {
            ptext += "\nDetails: " + npresence.details;
          }
          if (npresence.state) {
            ptext += "\n" + npresence.state;
          }
          if (npresence.party) {
            if (npresence.party.size)
              ptext +=
                "\nParty: " +
                npresence.party.size[0] +
                "/" +
                npresence.party.size[1];
          }
          if (npresence.assets) {
            if (npresence.assets.largeText)
              ptext += "\n" + npresence.assets.largeText;
            if (npresence.assets.smallText)
              ptext += "\n" + npresence.assets.smallText;
          }
          ptext += "\n";
        }
      }
    } else
      ptext = "None";
    */
    let flagtext = "Without flags";

    if (user.flags) {
      if (user.flags.toArray()) {
        if (user.flags.toArray().join("\n")) {
          flagtext = user.flags.toArray().join("\n");
        }
      }
    }

    const embed = new Discord.MessageEmbed()
      .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setTitle(`Information about ${user.username}`)
      .setColor("#00ff00")
      .setTimestamp();

    if (interaction.guild) {
      try {
        const member = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id, { cache: true });

        const perms = member.permissions.toArray();
        let permstext = "";
        if (perms.indexOf("ADMINISTRATOR") === -1) {
          permstext = perms.join(", ") || "Without permissions.";
        } else {
          permstext = "ADMINISTRATOR (All permissions)";
        }
        const perms2 = member.permissionsIn(interaction.channelId).toArray();
        let permstext2 = "";
        if (perms2.indexOf("ADMINISTRATOR") === -1) {
          permstext2 = perms2.join(", ") || "Without permissions.";
        } else {
          permstext2 = "ADMINISTRATOR (All permissions)";
        }

        embed.addField("Full Username", user.tag + "\n" + user.toString(), true)
          .addField("ID", user.id, true)
          .addField("Nickname", member.nickname ? `${member.nickname}` : "None", true)
          .addField("Bot?", user.bot ? "Yes" : "No", true);
        if (!user.bot) embed.addField("Nitro type", finaltext, true);
        embed
          /*.addField("Status", status2, true)
            .addField("Presence", ptext, true)*/
          .addField("Flags", `\`${flagtext}\``, true)
          .addField("Permissions (General)", `\`${permstext}\``, true)
          .addField("Permissions (Overwrites)", `\`${permstext2}\``, true)
          .addField("Still being verified?", member.pending ? "**Yes**" : "No")
        /*.addField("Last Message", user.lastMessage ? user.lastMessage.url : "Without fetch about that");*/
        if (!user.bot) embed.addField("Boosting?", member.premiumSince ? `Yes, since ${bot.botIntl.format(member.premiumSince)}` : "No");
        embed.addField(`Joined ${interaction.guild.name} at`, bot.botIntl.format(member.joinedAt))
          .addField("Joined Discord At", bot.botIntl.format(user.createdAt))
          .addField("Roles", `${member.roles.cache.filter(r => r.id !== interaction.guild.id).map(roles => `${roles}`).join(" **|** ") || "No Roles"}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        embed.addField("Full Username", user.tag + "\n" + user.toString(), true)
          .addField("ID", user.id, true)
          .addField("Bot?", user.bot ? "Yes" : "No", true);
        if (!user.bot) embed.addField("Nitro type", finaltext, true);
        embed
          /*.addField("Status", status2, true)
            .addField("Presence", Discord.Util.splitMessage(ptext, { maxLength: 1000 })[0], true)*/
          .addField("Flags", `\`${flagtext}\``, true)
          /*.addField(
            "Last Message",
            user.lastMessage ? user.lastMessage.url : "Without fetch about that"
          )*/
          .addField("Joined Discord at", bot.botIntl.format(user.createdAt));
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      embed.addField("Full Username", user.tag + "\n" + user.toString(), true)
        .addField("ID", user.id, true)
        .addField("Bot?", user.bot ? "Yes" : "No", true);
      if (!user.bot) embed.addField("Nitro type", finaltext, true);
      embed
        /*.addField("Status", status2, true)
          .addField("Presence", ptext, true)*/
        .addField("Flags", `\`${flagtext}\``, true)
        /*.addField(
          "Last Message",
          user.lastMessage ? user.lastMessage.url : "Without fetch about that"
        )*/
        .addField("Joined Discord at", bot.botIntl.format(user.createdAt));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}