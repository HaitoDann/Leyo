package shell

import (
	"os"
	"path/filepath"
	"strings"
)

// Chemin vers le fichier d'historique Windows
func historyPath() string {
	appData := os.Getenv("APPDATA")
	return filepath.Join(appData, "leyo_history.txt")
}

// Charge l'historique depuis le fichier
func LoadHistory() []string {
	data, err := os.ReadFile(historyPath())
	if err != nil {
		return []string{} // Pas de fichier = historique vide
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	return lines
}

// Sauvegarde une commande dans l'historique
func SaveToHistory(command string) {
	history := LoadHistory()

	// Évite les doublons consécutifs
	if len(history) > 0 && history[len(history)-1] == command {
		return
	}

	// Limite à 100 entrées
	history = append(history, command)
	if len(history) > 100 {
		history = history[len(history)-100:]
	}

	content := strings.Join(history, "\n")
	os.WriteFile(historyPath(), []byte(content), 0644)
}