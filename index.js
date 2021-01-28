/* BOT PLOUK */

const Discord = require("discord.js");

const ytdl = require("ytdl-core");

const client = new Discord.Client();

const prefix = "P?";

client.once('ready', () => {
  console.log('PLOUK!');
});

/* ONLYNUDES */

client.on('message', message => {
  if (message.content === '?onlynudes') {
    message.delete();
    message.channel.send(`${message.author} https://onlynudes.net/`);
  }
});

/* RANDOM MEGA */

const messages = [
 "https://mega.nz/folder/rAkkySwS#2H8yvn-AIFgtXnae7lK7ew",
 "https://mega.nz/folder/pgVFFKKS#ZcAJr2aHfv42NmWT7rcBtw", 
 "https://mega.nz/folder/wB0UkbgS#6CxAyIZXylBj6LQcGB4jEw", 
 "https://mega.nz/folder/7vpAiK4R#gtPDKOn-SjG_kcSyr1jYGg", 
 "https://mega.nz/folder/ZegSTJ4a#D3MJSaXExaKhLNSi2Lp37Q", 
 "https://mega.nz/folder/N7QF0CxB#Amjusr3OFvjPftdmcon6yw", 
 "https://mega.nz/folder/Gc1AQSaQ#FBugIShrUFzlHlXwXEbxTQ", 
 "https://mega.nz/folder/88kEVAjZ#0x91GYmbB7D6e-dWNqGE_A", 
 "https://mega.nz/folder/FFpzCDjC#FI-tTI4qdn2-DgpuRPuQSQ", 
 "https://mega.nz/folder/sVgG0CIA#Gc_XBb-zQmXUm1Rc86UVJA"
]

client.on('message', message => {
  if (message.content === '?randommega') {
    message.delete();
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    message.channel.send(`${message.author} ${randomMessage}`);
}
});

/* MUSIC */

const queue = new Map();

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send("Tu dois entrer une comande valide!");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Tu dois être dans un salon vocal!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "J'ai besoin de la permission pour venir et parler dans le salon!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} a était ajouté à la file d'attente!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Tu dois être dans le salon pour stoper la musique!"
    );
  if (!serverQueue)
    return message.channel.send("Il n'y a pas de musique que je peux passer!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Tu dois être dans le salon vocal pour stop!"
    );
    
  if (!serverQueue)
    return message.channel.send("Il n'y a pas de musique que je peux stop!");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.login("process.env.TOKEN");
