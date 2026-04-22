package shell

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

func aliasesPath() string {
	return filepath.Join(os.Getenv("APPDATA"), "Leyo", "aliases.json")
}

func LoadAliases() map[string]string {
	data, err := os.ReadFile(aliasesPath())
	if err != nil {
		return map[string]string{
			"ll": "ls -la",
			"la": "ls -a",
			"..": "cd ..",
		}
	}
	var aliases map[string]string
	json.Unmarshal(data, &aliases)
	return aliases
}

func SaveAlias(name, command string) error {
	aliases := LoadAliases()
	aliases[name] = command
	data, err := json.MarshalIndent(aliases, "", "  ")
	if err != nil {
		return err
	}
	os.MkdirAll(filepath.Dir(aliasesPath()), 0755)
	return os.WriteFile(aliasesPath(), data, 0644)
}

func DeleteAlias(name string) {
	aliases := LoadAliases()
	delete(aliases, name)
	data, _ := json.MarshalIndent(aliases, "", "  ")
	os.WriteFile(aliasesPath(), data, 0644)
}

func ResolveAlias(input string) string {
	aliases := LoadAliases()
	parts := strings.Fields(input)
	if len(parts) == 0 {
		return input
	}
	if resolved, ok := aliases[parts[0]]; ok {
		parts[0] = resolved
		return strings.Join(parts, " ")
	}
	return input
}