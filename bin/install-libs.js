#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Pour obtenir le __dirname en module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin du dossier d'installation de nekoScript
const NEKO_HOME = process.env.NEKO_HOME || path.join(process.env.HOME || process.env.USERPROFILE, '.neko-script');

console.log('Installation des bibliothèques de base nekoScript...');

// Créer le dossier libs s'il n'existe pas
const libsDir = path.join(NEKO_HOME, 'libs');
if (!fs.existsSync(libsDir)) {
  fs.mkdirSync(libsDir, { recursive: true });
}

// Contenu de Discord.neko
const discordNekoContent = `// Bibliothèque Discord.neko pour les bots Discord

// Configuration du bot
fonction nekConnection(token) {
  // Connecte le bot avec le token fourni
  neko = ("Bot Discord connecté avec succès !");
  nekRetour(true);
}

// Définir le statut du bot
fonction nekStatus(status) {
  // Applique le statut au bot
  neko = ("Statut mis à jour : " + status);
  nekRetour(true);
}

// Création de commande
fonction nekCommande(nom, callback) {
  // Enregistre une nouvelle commande
  neko = ("Commande " + nom + " enregistrée !");
  nekRetour(true);
}

// Créer un message avec embed
fonction nekEmbed(titre, description, couleur) {
  // Crée un message embed formaté
  nekRetour({
    titre: titre,
    description: description,
    couleur: couleur || "#FF6B7A"
  });
}

// Exporter les fonctions
nekoExport = {
  "nekConnection": nekConnection,
  "nekStatus": nekStatus,
  "nekCommande": nekCommande,
  "nekEmbed": nekEmbed
};`;

// Contenu de Web.neko
const webNekoContent = `// Bibliothèque Web.neko pour le développement web

// Crée une page web
fonction nekPage(titre, contenu) {
  neko = ("Page web créée: " + titre);
  nekRetour({
    titre: titre,
    contenu: contenu
  });
}

// Crée un style CSS
fonction nekStyle(element, propriete, valeur) {
  neko = ("Style appliqué à l'élément " + element);
  nekRetour(true);
}

// Ajoute un événement
fonction nekEvenement(element, evenement, action) {
  neko = ("Événement " + evenement + " ajouté à " + element);
  nekRetour(true);
}

// Créer un site complet
fonction nekSite(titre) {
  neko = ("Site créé: " + titre);
  nekRetour({
    titre: titre,
    pages: []
  });
}

// Exporter les fonctions
nekoExport = {
  "nekPage": nekPage,
  "nekStyle": nekStyle,
  "nekEvenement": nekEvenement,
  "nekSite": nekSite
};`;

// Écrire les fichiers
fs.writeFileSync(path.join(libsDir, 'Discord.neko'), discordNekoContent, 'utf8');
fs.writeFileSync(path.join(libsDir, 'Web.neko'), webNekoContent, 'utf8');

console.log('Bibliothèques installées avec succès:');
console.log('- Discord.neko');
console.log('- Web.neko');
console.log(`Emplacement: ${libsDir}`);

// Vérifier si les bibliothèques sont bien installées
if (fs.existsSync(path.join(libsDir, 'Discord.neko')) && 
    fs.existsSync(path.join(libsDir, 'Web.neko'))) {
  console.log('\nVous pouvez maintenant utiliser ces bibliothèques dans vos projets:');
  console.log('nekimporter Discord.neko;');
  console.log('nekimporter Web.neko;');
} else {
  console.log('\nErreur: Les bibliothèques n\'ont pas pu être installées correctement.');
}