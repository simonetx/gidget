const url = "https://discordbotlist.com/api/v1";
export default async function (bot) {
  // eslint-disable-next-line no-undef
  const res = await fetch(`${url}/bots/${bot.user.id}/stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": process.env.DISCORDBLTOKEN
    },
    body: JSON.stringify({
      guilds: bot.guilds.cache.size,
      users: bot.users.cache.size,
      voice_connections: bot.voice.adapters.size,
      shard_id: bot.shard?.ids[0] || 0
    })
  });
  if (!res.ok) console.error("discordbotlist.com: Error!");
  else console.log("discordbotlist.com: Posted!");
  return;
}