package config

import "os"

type Config struct {
	Port     string
	DBPath   string
	LogLevel string
}

func Load() Config {
	p := os.Getenv("PORT")
	if p == "" {
		p = "8080"
	}
	db := os.Getenv("DB_PATH")
	if db == "" {
		db = "./dogtracker.db"
	}
	lglvl := os.Getenv("LOG_LEVEL")
	if lglvl == "" {
		lglvl = "warn"
	}
	return Config{Port: p, DBPath: db, LogLevel: lglvl}
}
