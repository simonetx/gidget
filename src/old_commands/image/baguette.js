import { MessageEmbed } from 'discord.js';

export default class extends Command {
  constructor(options) {
    super(options)
    this.description = "turn someone into a baguette";
    this.permissions = {
      user: [0n, 0n],
      bot: [0n, 16384n]
    }
  }
  async run(bot, message) {
    const person = message.mentions.users.first() || message.author;
    const msg = await message.channel.send("Generating... (this may take a while)");
    // eslint-disable-next-line no-undef
    const res = await fetch(`https://nekobot.xyz/api/imagegen?type=baguette&url=${person.displayAvatarURL({ format: "png", size: 1024 })}`);

    if (!res.ok) return await message.channel.send("Something happened with the third-party API");
    const body = await res.json();
    const embed = new MessageEmbed()
      .setTitle("Here ya go")
      .setImage(body.message)
      .setColor("RANDOM");
    await msg.edit({ embeds: [embed] });
  }
}
