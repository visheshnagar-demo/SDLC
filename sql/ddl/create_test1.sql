CREATE TABLE IF NOT EXISTS `upbeat-repeater-477110-q6.analytics.test1` (
  `rank` INTEGER OPTIONS(description="Tour rank by gross revenue"),
  `peak` INTEGER OPTIONS(description="Peak rank attained"),
  `all_time_peak` INTEGER OPTIONS(description="All-time peak rank"),
  `actual_gross` INTEGER OPTIONS(description="Actual gross earnings in USD"),
  `adjusted_gross_in_2022_dollars` INTEGER OPTIONS(description="Adjusted gross revenue in 2022 USD"),
  `artist` STRING OPTIONS(description="Artist or band name"),
  `tour_title` STRING OPTIONS(description="Tour title"),
  `year_s` STRING OPTIONS(description="Tour year or year range"),
  `shows` INTEGER OPTIONS(description="Number of shows played"),
  `average_gross` INTEGER OPTIONS(description="Average gross earnings per show"),
  `ref` STRING OPTIONS(description="Source citation or reference"),
  `ingested_at` TIMESTAMP OPTIONS(description="UTC timestamp of pipeline ingestion"),
  `_source_file` STRING OPTIONS(description="Source GCS blob URI")
);
