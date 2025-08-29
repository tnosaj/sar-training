package log

import (
	"log"
	"os"
)

var Std = log.New(os.Stdout, "", log.LstdFlags|log.Lshortfile)
