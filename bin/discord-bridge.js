// discord-bridge.js
// Ce fichier sert de pont entre nekoScript et l'API Discord.js officielle

import { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SelectMenuBuilder } from 'discord.js';

// Classe singleton pour gérer le client Discord
class DiscordBridge {
  constructor() {
    if (DiscordBridge.instance) {
      return DiscordBridge.instance;
    }
    
    this.client = null;
    this.connected = false;
    this.commandHandlers = new Map();
    this.config = {
      prefix: '!',
      defaultColor: '#FF6B7A'
    };
    
    DiscordBridge.instance = this;
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
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages
    ];
    
    // Configurer les partials (objets partiels pour les événements)
    const partials = [
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ];
    
    // Créer le client Discord.js
    this.client = new Client({ intents, partials });
    console.log('Client Discord initialisé avec préfixe:', this.config.prefix);
    
    // Configurer le gestionnaire de messages par défaut pour les commandes
    this.client.on('messageCreate', (message) => {
      this._handleCommands(message);
    });
    
    return this.client;
  }
  
  // Se connecter à Discord avec un token
  async login(token) {
    if (!this.client) {
      console.error('Client Discord non initialisé. Utilisez init() d'abord.');
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
  
  // Définir le statut du bot
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
  
  // Enregistrer une commande
  registerCommand(name, description, callback) {
    this.commandHandlers.set(name.toLowerCase(), {
      name,
      description,
      callback
    });
    
    console.log(`Commande enregistrée: ${this.config.prefix}${name}`);
    return true;
  }
  
  // Gestionnaire interne des messages pour les commandes
  _handleCommands(message) {
    // Ignorer les messages des bots
    if (message.author.bot) return;
    
    // Vérifier si le message commence par le préfixe
    if (!message.content.startsWith(this.config.prefix)) return;
    
    // Extraire le nom de la commande et les arguments
    const args = message.content.slice(this.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Vérifier si la commande existe
    if (!this.commandHandlers.has(commandName)) return;
    
    // Exécuter le callback de la commande
    try {
      const command = this.commandHandlers.get(commandName);
      command.callback(message, args);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de la commande ${commandName}:`, error);
    }
  }
  
  // Enregistrer un événement
  on(eventName, callback) {
    if (!this.client) {
      console.error('Client Discord non initialisé. Utilisez init() d'abord.');
      return false;
    }
    
    this.client.on(eventName, callback);
    return true;
  }
  
  // Créer un embed Discord
  createEmbed(options) {
    const embed = new EmbedBuilder();
    
    // Appliquer les options de base
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    embed.setColor(options.color || this.config.defaultColor);
    
    // Ajouter les champs si fournis
    if (options.fields && Array.isArray(options.fields)) {
      options.fields.forEach(field => {
        embed.addFields({ name: field.name, value: field.value, inline: field.inline || false });
      });
    }
    
    // Ajouter l'image si fournie
    if (options.image) embed.setImage(options.image);
    
    // Ajouter la vignette si fournie
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    
    // Ajouter l'auteur si fourni
    if (options.author) {
      embed.setAuthor({
        name: options.author.name,
        iconURL: options.author.iconURL || null,
        url: options.author.url || null
      });
    }
    
    // Ajouter le footer si fourni
    if (options.footer) {
      embed.setFooter({
        text: options.footer.text,
        iconURL: options.footer.iconURL || null
      });
    }
    
    // Ajouter un timestamp si demandé
    if (options.timestamp) embed.setTimestamp();
    
    return embed;
  }
  
  // Créer un bouton Discord
  createButton(options) {
    // Mapper les styles en français vers les styles de bouton Discord.js
    const buttonStyles = {
      "primary": ButtonStyle.Primary,
      "secondary": ButtonStyle.Secondary,
      "success": ButtonStyle.Success,
      "danger": ButtonStyle.Danger,
      "link": ButtonStyle.Link
    };
    
    const button = new ButtonBuilder()
      .setLabel(options.label || 'Bouton')
      .setStyle(buttonStyles[options.style] || ButtonStyle.Primary);
    
    // Définir l'ID personnalisé ou l'URL selon le style
    if (options.style === 'link' && options.url) {
      button.setURL(options.url);
    } else {
      button.setCustomId(options.customId || `button_${Date.now()}`);
    }
    
    // Ajouter l'emoji si fourni
    if (options.emoji) button.setEmoji(options.emoji);
    
    // Définir si le bouton est désactivé
    if (options.disabled) button.setDisabled(true);
    
    return button;
  }
  
  // Créer une ligne d'action (pour les boutons et les menus)
  createActionRow(components) {
    const row = new ActionRowBuilder();
    
    if (Array.isArray(components) && components.length > 0) {
      row.addComponents(components);
    }
    
    return row;
  }
  
  // Obtenir le client Discord
  getClient() {
    return this.client;
  }
  
  // Vérifier si le client est connecté
  isConnected() {
    return this.connected;
  }
  
  // Corriger les commentaires apostrophes
  fixComments() {
    return true;
  }
}

// Exporter une instance unique du pont Discord
export default new DiscordBridge();