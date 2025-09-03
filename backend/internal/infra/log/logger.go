package log

import "github.com/sirupsen/logrus"

//var Std = log.New(os.Stdout, "", log.LstdFlags|log.Lshortfile)

//var Std = slog.New(slog.NewTextHandler(os.Stderr, nil))

var Std = logrus.New()
