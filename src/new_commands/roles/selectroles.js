import db from '../../database/models/selectroles.js';
import { MessageEmbed, MessageActionRow, MessageSelectMenu } from "discord.js";

export default class extends SlashCommand {
  constructor(options) {
    super(options);
    this.deployOptions.description = "Use Discord's new menu selector to add self-roles to users in just 1 step.";
    this.deployOptions.options = [{
      name: "add",
      description: "Add roles(options) to use in a message later",
      type: "SUB_COMMAND",
      options: [{
        name: "role",
        description: "The role to add if selected.",
        type: "ROLE",
        required: true
      }, {
        name: "role-name",
        description: "The name that will be displayed to the user, by default current role name. (MAX 25 CHARACTERS)",
        type: "STRING",
        required: false
      }, {
        name: "description",
        description: "A short description for the role option (MAX 50 CHARACTERS)",
        type: "STRING",
        required: false
      }, {
        name: "emoji",
        description: "A valid emoji",
        type: "STRING",
        required: false
      }]
    }, {
      name: "remove",
      description: "Remove roles(options)",
      type: "SUB_COMMAND",
      options: [{
        name: "role",
        description: "The role to remove from the list",
        type: "ROLE",
        required: false
      }, {
        name: "role-name",
        description: "This is in case you removed the role. Put the name previously set to delete it from the list.",
        type: "STRING",
        required: false
      }]
    }, {
      name: "clear",
      description: "Clear the added roles, so you can start another message with another list",
      type: "SUB_COMMAND"
    }, {
      name: "view",
      description: "Check out the roles you added",
      type: "SUB_COMMAND",
    }, {
      name: "create-instance",
      description: "Create a message with a list of the provided roles.",
      type: "SUB_COMMAND",
      options: [{
        name: "channel",
        description: "On which channel will I send that message?",
        type: "CHANNEL",
        channelTypes: [0, 5, 10, 11, 12],
        required: true
      }, {
        name: "content",
        description: "Default message top content (MAX 2000 CHARACTERS)",
        type: "STRING",
        required: true
      }, {
        name: "placeholder",
        description: "Text that will appear when the user views the menu without anything selected. (MAX 100 CHARACTERS)",
        type: "STRING",
        required: false
      }]
    }, {
      name: "add-to-instance",
      description: "Add this menu to a ready-made message from the bot. Useful when creating an embed with the command.",
      type: "SUB_COMMAND",
      options: [{
        name: "channel",
        description: "On which channel is this message located?",
        type: "CHANNEL",
        channelTypes: [0, 5, 10, 11, 12],
        required: true,
      }, {
        name: "message",
        description: "ID of the message to add the component to.",
        type: "STRING",
        required: true
      }, {
        name: "placeholder",
        description: "Text that will appear when the user views the menu without anything selected. (MAX 100 CHARACTERS)",
        type: "STRING",
        required: false
      }]
    }
    ]
    this.guildonly = true;
    this.permissions = {
      user: [8n, 0n],
      bot: [268435456n, 0n]
    }
  }
  async run(bot, interaction) {
    const doc = await db.findOne({ guildId: interaction.guild.id })
    switch (interaction.options.getSubcommand()) {
      case 'add': {
        if (doc?.roles.length > 25) return interaction.reply("You can only have 25 roles(options) per list.")
        const option = {
          id: interaction.options.getRole("role", true).id,
          name: interaction.options.getString("role-name", false) || interaction.options.getRole("role", true).name,
          description: interaction.options.getString("description", false),
          emoji: interaction.options.getString("emoji", false) || 1
        }
        if (option.name.length > 25) return interaction.reply("[add.role-name] You can only put up to 25 characters max.");
        if (option.description?.length > 50) return interaction.reply("[add.description] You can only put up to 50 characters max.");

        const elist = await interaction.guild.emojis.fetch();
        const resolvedEmoji = (option.emoji !== 1 ? (elist.get(option.emoji)?.identifier || elist.find(e => e.name === option.emoji || e.toString() === option.emoji)?.identifier || (/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(option.emoji) ? option.emoji : undefined)) : undefined);
        if ((!resolvedEmoji) && (option.emoji !== 1)) return interaction.reply("[add.emoji] Invalid default or server emoji.");
        option.emoji = resolvedEmoji;

        if (doc) await doc.updateOne({ $push: { roles: option } });
        else await db.create({ guildId: interaction.guild.id, roles: [option] });
        interaction.reply("Role added to the list");
      }
        break;
      case 'remove': {
        if (!doc) return interaction.reply("[remove] Invalid role");
        if (interaction.options.getRole("role", false)) {
          const verify = doc.roles.find(e => e.id === interaction.options.getRole("role").id)
          if (!verify) return interaction.reply("[remove.role] Invalid role");
          else await doc.updateOne({ $pull: { roles: { id: { $eq: verify.id } } } });
          interaction.reply("Role removed from the list");
        } else if (interaction.options.getString("role-name", false)) {
          const verify = doc.roles.find(e => e.name === interaction.options.getString("role-name"))
          if (!verify) return interaction.reply("[remove.role-name] Invalid role");
          else await doc.updateOne({ $pull: { roles: { id: { $eq: verify.id } } } });
          interaction.reply("Role removed from the list");
        } else interaction.reply("[remove] Specify at least one option.");
      }
        break;
      case 'clear': {
        if (!doc) return interaction.reply("[clear] Nothing to clean here.");
        else doc.deleteOne();
        interaction.reply("All the list has been cleared.");
      }
        break;
      case 'view': {
        if (!doc?.roles.length) return interaction.reply("You have nothing on the list. Add roles using `add`");
        const fields = doc.roles.map(e => {
          return {
            name: e.name,
            value: `<@&${e.id}> -> ${e.description || "*no description*"} -> ${e.emoji ? (/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(e.emoji) ? e.emoji : `<${(e.emoji.startsWith("a") ? "" : ":") + e.emoji}>`) : "*no emoji*"}`
          }
        });
        const embed = new MessageEmbed()
          .setTitle("Ready-to-use roles for the select menu")
          .setColor("RANDOM")
          .setTimestamp()
          .addFields(fields);
        interaction.reply({ embeds: [embed] });
      }
        break;
      case 'create-instance': {
        if (!doc?.roles.length) return interaction.reply("You have nothing on the list. Add roles using `add`");
        if (interaction.options.getString("placeholder", false)?.length > 100) return interaction.reply("[create-instace.placeholder] You can only put up to 100 characters max.");
        if (interaction.options.getString("content", true).length > 2000) return interaction.reply("[create-instace.content] You can only put up to 2000 characters max.");
        const verify = doc.roles.every(e => interaction.guild.roles.cache.has(e.id));
        if (!verify) return interaction.reply("You seem to have an invalid role on the list. Fix it using `remove`.");
        const options = doc.roles.map(e => {
          return {
            label: e.name,
            value: `selectroles_f_ro_${e.id}`,
            description: e.description,
            emoji: e.emoji
          }
        });
        const menu = new MessageSelectMenu()
          .setCustomId("selectroles_f_0")
          .setMinValues(0)
          .setMaxValues(doc.roles.length)
          .addOptions(options);
        const plc = interaction.options.getString("placeholder", false);
        if (plc) menu.setPlaceholder(plc);
        const channel = interaction.options.getChannel("channel", true);
        if (!channel.permissionsFor(bot.user.id).has("SEND_MESSAGES")) return interaction.reply("[create-instance.channel] I don't have permissions to send messages in that channel!");
        await channel.send({ content: interaction.options.getString("content", true), components: [new MessageActionRow().addComponents([menu])] });
        interaction.reply("Message sent. Test it ;)")
      }
        break;
      case 'add-to-instance': {
        if (!doc?.roles.length) return interaction.reply("You have nothing on the list. Add roles using `add`");
        if (interaction.options.getString("placeholder", false)?.length > 100) return interaction.reply("[add-to-instance.placeholder] You can only put up to 100 characters max.");
        const verify = doc.roles.every(e => interaction.guild.roles.cache.has(e.id));
        if (!verify) return interaction.reply("You seem to have an invalid role on the list. Fix it using `remove`.");
        const options = doc.roles.map(e => {
          return {
            label: e.name,
            value: `selectroles_f_ro_${e.id}`,
            description: e.description,
            emoji: e.emoji
          }
        });
        const menu = new MessageSelectMenu()
          .setMinValues(0)
          .setMaxValues(doc.roles.length)
          .addOptions(options);
        const plc = interaction.options.getString("placeholder", false);
        if (plc) menu.setPlaceholder(plc);
        const channel = interaction.options.getChannel("channel", true);
        if (!channel.permissionsFor(bot.user.id).has("SEND_MESSAGES")) return interaction.reply("[add-to-instance.channel] I don't have permissions to send messages in that channel!");

        const msg = await channel.messages.fetch(interaction.options.getString("message", true)).catch(() => { });
        if (!msg) return interaction.reply("[add-to-instance.message] Invalid message ID!");
        if (msg.author.id !== bot.user.id) return interaction.reply("[add-to-instance.message] That message is not mine...");
        if (msg.components.length >= 5) return interaction.reply(`[add-to-instance.message] This message already has all 5 action rows filled.
Only up to 5 action rows are allowed in a message.
A select menu occupies the entire action row.`);
        menu.setCustomId(`selectroles_f_${msg.components.length || 0}`)
        await msg.edit({ components: msg.components.concat([new MessageActionRow().addComponents([menu])]) });
        await interaction.reply("Message edited. Test it ;)");
      }
        break;
    }
  }
}