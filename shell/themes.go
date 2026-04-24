package shell

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Theme struct {
	Name    string `json:"name"`
	Cyan    string `json:"cyan"`
	Blue    string `json:"blue"`
	Violet  string `json:"violet"`
	Magenta string `json:"magenta"`
	Bg      string `json:"bg"`
	Bg2     string `json:"bg2"`
	Text    string `json:"text"`
}

var DefaultThemes = []Theme{
	{
		Name: "PRISM", // défaut
		Cyan: "#5BC8E8", Blue: "#5577DD", Violet: "#8855EE", Magenta: "#CC44AA",
		Bg: "rgba(8,8,14,0.85)", Bg2: "rgba(11,11,20,0.90)", Text: "#D8D8E8",
	},
	{
		Name: "OCEAN",
		Cyan: "#00E5FF", Blue: "#0077FF", Violet: "#0044CC", Magenta: "#00CCBB",
		Bg: "rgba(4,12,20,0.85)", Bg2: "rgba(6,16,26,0.90)", Text: "#D0E8F0",
	},
	{
		Name: "FOREST",
		Cyan: "#44FF88", Blue: "#22BB66", Violet: "#118844", Magenta: "#AADD22",
		Bg: "rgba(4,12,8,0.85)", Bg2: "rgba(6,14,10,0.90)", Text: "#D0F0D8",
	},
	{
		Name: "SUNSET",
		Cyan: "#FFB830", Blue: "#FF7722", Violet: "#EE4444", Magenta: "#FF44AA",
		Bg: "rgba(14,8,8,0.85)", Bg2: "rgba(18,10,10,0.90)", Text: "#F0E0D0",
	},
	{
		Name: "MONO",
		Cyan: "#CCCCCC", Blue: "#AAAAAA", Violet: "#888888", Magenta: "#EEEEEE",
		Bg: "rgba(10,10,10,0.90)", Bg2: "rgba(14,14,14,0.92)", Text: "#E0E0E0",
	},
}

func themePath() string {
	return filepath.Join(os.Getenv("APPDATA"), "Leyo", "theme.json")
}

func LoadCurrentTheme() Theme {
	data, err := os.ReadFile(themePath())
	if err != nil {
		return DefaultThemes[0]
	}
	var t Theme
	if err := json.Unmarshal(data, &t); err != nil {
		return DefaultThemes[0]
	}
	return t
}

func SaveCurrentTheme(t Theme) error {
	os.MkdirAll(filepath.Dir(themePath()), 0755)
	data, err := json.MarshalIndent(t, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(themePath(), data, 0644)
}