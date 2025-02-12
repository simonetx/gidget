import { MessageEmbed } from 'discord.js';
let pages;
export default class extends Command {
  constructor(options) {
    super(options);
    this.aliases = ['tt'];
    this.description = "Shows a title card from the Wubbzy show!";
    this.permissions = {
      user: [0n, 0n],
      bot: [0n, 16384n]
    }
  }
  async run(bot, message, args) {
    if (!pages) {
      // eslint-disable-next-line no-undef
      const res = await fetch("https://wubbzy.fandom.com/api.php?action=query&format=json&prop=&list=categorymembers&meta=&formatversion=2&cmtitle=Category%3AEpisodes&cmprop=title&cmtype=page&cmlimit=250");
      pages = (await res.json()).query.categorymembers.filter(e => !e.title.includes("/")).map(e => e.title);
    }
    const page = pages.find(e => {
      const to = e.replace("(episode)", "").trimEnd();
      return to.toLowerCase() === args.slice(1).join(" ").toLowerCase() || to.replace("!", "").toLowerCase() === args.slice(1).join(" ").toLowerCase();
    });
    if (!args[1] || !page) {
      const embed = new MessageEmbed()
        .setDescription(pages.map(e => e.replace("(episode)", "").trimEnd()).join("\n"))
        .setTitle("List of episodes");
      return await message.channel.send({ embeds: [embed] });
    }
    // eslint-disable-next-line no-undef
    const r2 = await fetch(`https://wubbzy.fandom.com/api.php?action=imageserving&format=json&wisTitle=${encodeURIComponent(page)}&formatversion=2`)
    const res2 = await r2.json();
    const embed = new MessageEmbed()
      .setImage(`${res2.image.imageserving}&format=original`)
      .setTitle(`${page.replace("(episode)", "").trimEnd()}'s title card`);
    await message.channel.send({ embeds: [embed] });
  }
}