source("scripts/r/utils.R")

franchises_json <- fromJSON(paste0(sixth_city_path_json, "team_metadata.json"))
stg_franchises <- read.csv("data/sixth-city/api/stg_franchises.csv") %>%
  select(-c(franchise_name, co_owners))
franchises_bind <- data.frame()

for (f in seq_len(length(franchises_json))) {
  stg_franchise <- stg_franchises %>%
    filter(franchise_id == f)
  franchise_json <- franchises_json[[f]]
  if (is.null(franchise_json$history)) {
    franchise_df <- as.data.frame(franchise_json) %>%
      mutate(franchise_id = f) %>%
      right_join(stg_franchise, join_by(franchise_id))
  } else {
    franchise_history_df <- franchise_json$history %>%
      separate_rows(season, sep = ", ") %>%
      mutate(franchise_id = f) %>%
      inner_join(stg_franchise, join_by(franchise_id, season))
    franchise_df <- franchise_json[-length(franchise_json)] %>%
      as.data.frame() %>%
      mutate(franchise_id = f) %>%
      right_join(stg_franchise %>%
                   filter(!(season %in% franchise_history_df$season)),
                 join_by(franchise_id)) %>%
      rbind(franchise_history_df)
  }
  franchises_bind <- franchises_bind %>%
    rbind(franchise_df)
}

franchises <- franchises_bind %>%
  arrange(franchise_id, season) %>%
  relocate(franchise_id, season, franchise_name, abbrev)

write.csv(franchises,
          paste0(sixth_city_path_api, "fact_franchises.csv"), row.names = FALSE)
