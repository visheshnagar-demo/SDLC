-- BigQuery DDL for Target Table: postgres_test2
CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.postgres_test2` (
  id STRING NOT NULL OPTIONS(description="Unique record identifier"),
  name STRING OPTIONS(description="Entity name, whitespace trimmed"),
  category STRING OPTIONS(description="Category classification"),
  amount FLOAT64 OPTIONS(description="Numeric amount value"),
  status STRING OPTIONS(description="Status code"),
  created_at TIMESTAMP OPTIONS(description="Record creation timestamp"),
  updated_at TIMESTAMP OPTIONS(description="Last update timestamp"),
  _etl_loaded_at TIMESTAMP NOT NULL OPTIONS(description="Pipeline audit timestamp injected at load time")
);
