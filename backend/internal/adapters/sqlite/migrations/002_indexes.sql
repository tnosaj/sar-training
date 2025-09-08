CREATE INDEX IF NOT EXISTS idx_rounds_session ON rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_rounds_dog ON rounds(dog_id);
CREATE INDEX IF NOT EXISTS idx_rounds_planned ON rounds(planned_behavior_id);
CREATE INDEX IF NOT EXISTS idx_rounds_exhibited ON rounds(exhibited_behavior_id);
CREATE INDEX IF NOT EXISTS idx_behavior_exercise_ex ON behavior_exercises(exercise_id);