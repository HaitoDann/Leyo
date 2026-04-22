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

	// ── Gestion complète du cd ─────────────────────────────────
	if trimmed == "cd" {
		// cd seul → retourne à la racine du lecteur courant
		current, _ := os.Getwd()
		root := filepath.VolumeName(current) + `\`
		if err := os.Chdir(root); err != nil {
			return map[string]string{"output": "", "error": err.Error(), "suggestion": ""}
		}
		newPath, _ := os.Getwd()
		return map[string]string{"output": "→ " + newPath, "error": "", "suggestion": ""}
	}

	if strings.HasPrefix(trimmed, "cd ") {
		dir := strings.TrimPrefix(trimmed, "cd ")
		dir = strings.Trim(dir, "\"")
		dir = strings.TrimSpace(dir)

		// Résout le chemin correctement (relatif ou absolu)
		if !filepath.IsAbs(dir) {
			current, _ := os.Getwd()
			dir = filepath.Join(current, dir)
		}

		// Nettoie le chemin (.., ., doubles séparateurs)
		dir = filepath.Clean(dir)

		if err := os.Chdir(dir); err != nil {
			return map[string]string{
				"output":     "",
				"error":      "Impossible d'accéder à : " + dir,
				"suggestion": "",
			}
		}
		newPath, _ := os.Getwd()
		return map[string]string{"output": "→ " + newPath, "error": "", "suggestion": ""}
	}

	result, errMsg := shell.RunWithOutput(input)

	isWindowsError := strings.Contains(result, "n'est pas reconnu") ||
		strings.Contains(result, "not recognized") ||
		strings.Contains(result, "not found") ||
		strings.Contains(result, "impossible de trouver")

	if isWindowsError {
		errMsg = result
		result = ""
	}

	suggestion := ""
	if errMsg != "" || isWindowsError {
		history := shell.LoadHistory()
		if closest, found := shell.FindClosest(trimmed, history); found {
			suggestion = closest
		}
	}

	return map[string]string{
		"output": result, "error": errMsg, "suggestion": suggestion,
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