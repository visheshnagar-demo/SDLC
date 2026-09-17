-- DDL for Target Analytics Table
CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.transformed_data` (
  record_id STRING NOT NULL OPTIONS(description="Unique record identifier"),
  data_payload STRING OPTIONS(description="JSON serialized key-value attributes of the transformed record"),
  created_at TIMESTAMP OPTIONS(description="Record creation timestamp"),
  _ingestion_timestamp TIMESTAMP NOT NULL OPTIONS(description="UTC timestamp of ETL pipeline ingestion"),
  _source_file STRING NOT NULL OPTIONS(description="Source GCS blob URI")
)
PARTITION BY DATE(_ingestion_timestamp)
CLUSTER BY record_id
OPTIONS(
  description="Transformed analytics records loaded from GCS CSV pipeline"
);

-- DDL for Dead-Letter Analytics Errors Table
CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.analytics_errors` (
  error_id STRING NOT NULL OPTIONS(description="Unique error identifier"),
  raw_record STRING OPTIONS(description="Raw serialized record string"),
  error_message STRING NOT NULL OPTIONS(description="Details of validation or parsing failure"),
  _ingestion_timestamp TIMESTAMP NOT NULL OPTIONS(description="UTC timestamp of error logging"),
  _source_file STRING NOT NULL OPTIONS(description="Source GCS blob URI")
)
PARTITION BY DATE(_ingestion_timestamp)
CLUSTER BY error_id
OPTIONS(
  description="Dead-letter error records from GCS CSV transformation failures"
);
