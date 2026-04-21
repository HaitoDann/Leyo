package shell

import "strings"

// Traduction commandes Unix → Windows
var unixToWindows = map[string]string{
	"ls":    "dir",
	"rm":    "del",
	"cp":    "copy",
	"mv":    "move",
	"cat":   "type",
	"clear": "cls",
	"pwd":   "cd",
	"mkdir": "mkdir",
	"touch": "echo. >",
}

func Parse(input string) string {
	parts := strings.Fields(input)
	if len(parts) == 0 {
		return input
	}
	if windows, ok := unixToWindows[parts[0]]; ok {
		parts[0] = windows
	}
	return strings.Join(parts, " ")
}