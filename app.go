package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/HaitoDann/Leyo/shell"
)

type FileEntry struct {
	Name  string
	IsDir bool
	Ext   string
}

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) RunCommand(input string) map[string]string {
	trimmed := strings.TrimSpace(input)

	// Gestion du cd
	if strings.HasPrefix(trimmed, "cd ") {
		dir := strings.TrimPrefix(trimmed, "cd ")
		dir = strings.Trim(dir, "\"")
		if err := os.Chdir(dir); err != nil {
			return map[string]string{
				"output":     "",
				"error":      err.Error(),
				"suggestion": "",
			}
		}
		newPath, _ := os.Getwd()
		return map[string]string{
			"output":     "→ " + newPath,
			"error":      "",
			"suggestion": "",
		}
	}

	result, errMsg := shell.RunWithOutput(input)

	// Bug 2 fix : on cherche une suggestion même si result n'est pas vide
	// (commande inconnue de Windows retourne quand même un output texte)
	suggestion := ""
	history := shell.LoadHistory()
	if closest, found := shell.FindClosest(input, history); found {
		// On ne suggère que si la commande ressemble à une erreur
		if strings.Contains(strings.ToLower(result+errMsg), "reconnu") ||
			strings.Contains(strings.ToLower(result+errMsg), "not recognized") ||
			strings.Contains(strings.ToLower(result+errMsg), "not found") ||
			errMsg != "" {
			suggestion = closest
		}
	}

	// Bug 3 fix : si Windows retourne une erreur dans result, on la met dans error
	if errMsg == "" && (strings.Contains(result, "n'est pas reconnu") ||
		strings.Contains(result, "not recognized") ||
		strings.Contains(result, "not found")) {
		errMsg = result
		result = ""
	}

	return map[string]string{
		"output":     result,
		"error":      errMsg,
		"suggestion": suggestion,
	}
}

func (a *App) GetHistory() []string {
	h := shell.LoadHistory()
	if h == nil {
		return []string{}
	}
	return h
}

func (a *App) SaveHistory(cmd string) {
	shell.SaveToHistory(cmd)
}

func (a *App) GetCurrentPath() string {
	dir, err := os.Getwd()
	if err != nil {
		return `C:\`
	}
	return dir
}

// Bug 1 fix : on force le dossier courant avant de lire
func (a *App) ListFiles() []FileEntry {
	dir, err := os.Getwd()
	if err != nil {
		return []FileEntry{}
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return []FileEntry{}
	}

	var files []FileEntry
	for _, e := range entries {
		if e.IsDir() {
			files = append(files, FileEntry{Name: e.Name(), IsDir: true, Ext: ""})
		}
	}
	for _, e := range entries {
		if !e.IsDir() {
			files = append(files, FileEntry{
				Name:  e.Name(),
				IsDir: false,
				Ext:   filepath.Ext(e.Name()),
			})
		}
	}
	return files
}