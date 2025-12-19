source("scripts/r/utils.R")

path_api  <- "data/sixth-city/api/"
path_json <- "data/sixth-city/content/"

# Initialize data tables
tables <- list(
  'draft' = c('draft_id', 'type', 'season', 'round', 'pick'),
  'franchises' = c('franchise_id', 'season'),
  'league' = c('league_id'),
  'schedule' = c('week', 'franchise_id', 'season'),
  'standings' = c('franchise_id', 'franchise_name', 'season'),
  'starters' = c('franchise_id', 'franchise_name', 'week', 'season'),
  'transactions' = c('timestamp'),
  # below tables are full, not incremental, load
  'draftpicks' = c(),
  'rosters' = c()
  )


# Read the JSON file
league_configs <- fromJSON(paste0(path_json, 'league_config.json'))

# Iterate with a for loop
for (i in 1:nrow(league_configs)) {

  # Connect to the league
  con <- ff_connect(
    platform = league_configs$platform[i],
    league_id = league_configs$league_id[i],
    season = league_configs$season[i]
    )
  
  for (t in 1:length(tables)) {
    table <- tables[t]
    temp_path <- paste0(path_api, names(table), '.csv')
    temp_data <- get(paste0("ff_", names(table)))(con) %>% 
      mutate(season = league_configs$season[i])
    if (names(table) %in% c('draftpicks', 'rosters')) {
      write.csv(temp_data, temp_path, row.names = F)
      cat(paste0("Rewritten ", temp_path, " (", nrow(temp_data), " rows)\n"))
    } else {
      upsert(
        temp_data, temp_path, key_cols = unname(unlist(table)), write = T
      )
    }
  }
}
