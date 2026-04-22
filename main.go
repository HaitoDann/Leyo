package main

import (
	"embed"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend
var assets embed.FS

func main() {
	app := NewApp()

	dataDir := filepath.Join(os.Getenv("APPDATA"), "Leyo")
	os.MkdirAll(dataDir, 0755)

	err := wails.Run(&options.App{
		Title:     "Leyo Shell",
		Width:     1100,
		Height:    680,
		MinWidth:  800,
		MinHeight: 500,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 10, G: 10, B: 15, A: 230},
		OnStartup:        app.startup,
		Bind:             []interface{}{app},
		Windows: &windows.Options{
			WebviewIsTransparent:              true,
			WindowIsTranslucent:               true,
			BackdropType:                      windows.Acrylic,
			DisableWindowIcon:                 false,
			IsZoomControlEnabled:              false,
			WebviewUserDataPath:               dataDir,
		},
	})
	if err != nil {
		println("Erreur Wails:", err.Error())
	}
}