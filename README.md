<div align="center">
  <img src="frontend/assets/logo.png" width="120"/>
  <h1>Leyo Shell</h1>
  <p>Un shell moderne pour Windows — syntaxe Unix, interface élégante</p>

  ![Version](https://img.shields.io/badge/version-2.0.0-7B2FFF)
  ![Platform](https://img.shields.io/badge/platform-Windows-00C8FF)
  ![Language](https://img.shields.io/badge/Go-Wails-FF00CC)
  ![Author](https://img.shields.io/badge/by-VinX-FF3399)
</div>

---

## ✨ Fonctionnalités

- **Syntaxe Unix** — tape `ls`, `rm`, `mkdir`, `cp` nativement sous Windows
- **Dual-pane** — sidebar fichiers interactive qui se met à jour en temps réel
- **Correction intelligente** — détecte tes fautes de frappe et propose la bonne commande
- **Ghost text** — autocomplétion en texte grisé, valide avec `→` ou `Tab`
- **Historique** — navigue avec `↑` `↓`, consulte avec `history`
- **Onglets** — plusieurs sessions simultanées avec `Ctrl+T`
- **Alias** — crée tes propres raccourcis de commandes
- **Interface native** — vraie fenêtre app Windows, pas une invite de commande

---

## 📥 Installation

### Option 1 — Installeur (recommandé)
1. Télécharge `LeyoSetup.exe` depuis la section [Releases](../../releases)
2. Lance l'installeur
3. Leyo apparaît sur le Bureau et dans le Menu Démarrer

### Option 2 — Portable
1. Télécharge `Leyo.exe` depuis la section [Releases](../../releases)
2. Place le dans `C:\Leyo\`
3. Lance `Leyo.exe`

> ⚠️ Windows peut afficher un avertissement "application inconnue" car Leyo n'est pas encore signé numériquement. Clique sur **"Informations complémentaires" → "Exécuter quand même"**.

---

## 🎮 Commandes disponibles

### Navigation
| Commande | Description |
|---|---|
| `ls` | Liste les fichiers du dossier courant |
| `cd dossier` | Change de dossier |
| `cd ..` | Remonte d'un niveau |
| `pwd` | Affiche le chemin courant |
| `mkdir nom` | Crée un dossier |

### Fichiers
| Commande | Description |
|---|---|
| `cp source dest` | Copie un fichier |
| `mv source dest` | Déplace un fichier |
| `rm fichier` | Supprime un fichier |
| `cat fichier` | Affiche le contenu d'un fichier |
| `touch fichier` | Crée un fichier vide |

### Leyo
| Commande | Description |
|---|---|
| `history` | Affiche l'historique des commandes |
| `alias` | Liste les alias définis |
| `alias ll="ls -la"` | Crée un alias |
| `unalias ll` | Supprime un alias |
| `clear` | Vide l'écran |
| `exit` | Ferme Leyo |

### Raccourcis clavier
| Raccourci | Action |
|---|---|
| `↑` / `↓` | Naviguer dans l'historique |
| `→` ou `Tab` | Accepter le ghost text |
| `Ctrl+T` | Nouvel onglet |
| `Ctrl+W` | Fermer l'onglet |
| `Ctrl+C` | Copier la sélection |
| `Ctrl+V` | Coller dans le prompt |
| `Ctrl+A` | Sélectionner tout |

---

## 🛠️ Stack technique

| Élément | Technologie |
|---|---|
| Langage | Go 1.22 |
| Framework desktop | Wails v2 |
| Frontend | HTML / CSS / JS vanilla |
| Correction | Algorithme de Levenshtein |
| Build | GitHub Actions |

---

## 🏗️ Architecture