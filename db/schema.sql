CREATE TABLE IF NOT EXISTS establishments (
  id SERIAL PRIMARY KEY,
  osm_id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  establishment_id INTEGER NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  lighting SMALLINT NOT NULL CHECK (lighting BETWEEN 1 AND 5),
  acoustics SMALLINT NOT NULL CHECK (acoustics BETWEEN 1 AND 5),
  table_density SMALLINT NOT NULL CHECK (table_density BETWEEN 1 AND 5),
  road_noise SMALLINT NOT NULL CHECK (road_noise BETWEEN 1 AND 5),
  seating_comfort SMALLINT NOT NULL CHECK (seating_comfort BETWEEN 1 AND 5),
  note TEXT,
  photo_path TEXT,
  user_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ratings_establishment_id_idx ON ratings (establishment_id);

CREATE TABLE IF NOT EXISTS flags (
  id SERIAL PRIMARY KEY,
  rating_id INTEGER NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  establishment_id INTEGER REFERENCES establishments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
