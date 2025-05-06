import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';

// Classe singleton pour gérer le client Discord
class DiscordBridge {
  constructor() {
    this.client = null;
    this.connected = false;
    this.config = {
      prefix: '!',
      defaultColor: '#FF6B7A'
    };
  }

  // Initialiser le client Discord avec les options fournies
  init(options = {}) {
    if (this.client) {
      console.log('Client Discord déjà initialisé');
      return this.client;
    }

    // Fusionner les options avec les valeurs par défaut
    if (options.prefix) this.config.prefix = options.prefix;
    if (options.defaultColor) this.config.defaultColor = options.defaultColor;

    // Configurer les intents (autorisations) du client
    const intents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ];

    // Créer le client Discord.js
    this.client = new Client({ 
      intents,
      partials: [Partials.Channel] 
    });
    console.log('Client Discord initialisé avec préfixe:', this.config.prefix);

    return this.client;
  }

  // Se connecter à Discord avec un token
  async login(token) {
    if (!this.client) {
      console.error('Client Discord non initialisé. Utilisez init() dabord.');
      return false;
    }

    try {
      await this.client.login(token);
      this.connected = true;
      console.log(`Bot connecté en tant que ${this.client.user.tag}`);
      return true;
    } catch (error) {
      console.error('Erreur de connexion à Discord:', error);
      return false;
    }
  }

  // Définir le statut du bot (kept for completeness, though not in edited code)
  setActivity(type, name) {
    if (!this.client || !this.connected) {
      console.error('Client Discord non connecté.');
      return false;
    }

    // Mapper les types en français vers les types d'activité Discord.js
    const activityTypes = {
      "joue": "Playing",
      "regarde": "Watching",
      "écoute": "Listening",
      "diffuse": "Streaming"
    };

    // Définir l'activité du bot
    const activityType = activityTypes[type] || "Playing";
    this.client.user.setActivity(name, { type: activityType });

    return true;
  }


  // Créer un embed Discord
  createEmbed(options) {
    const embed = new EmbedBuilder()
      .setColor(options.color || this.config.defaultColor);

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);

    return embed;
  }

  //Simplified command handling
  addCommand(name, callback) {
    if (!this.client) return false;

    this.client.on('messageCreate', message => {
      if (!message.content.startsWith(this.config.prefix)) return;

      const args = message.content.slice(this.config.prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (command === name) {
        callback(message, args);
      }
    });

    return true;
  }

  // methods removed due to absence in edited code:
  // registerCommand
  // _handleCommands
  // on
  // createButton
  // createActionRow
  // getClient
  // isConnected
  // fixComments


}

// Exporter une instance unique du pont Discord
export default new DiscordBridge();