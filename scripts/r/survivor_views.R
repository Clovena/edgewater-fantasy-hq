source("scripts/r/utils.R")

###
# V_FACT_STANDINGS
###

team_metadata <- do.call(
  rbind.data.frame,
  fromJSON("data/survivor/ref/team_metadata.json")
) %>%
  tibble::rownames_to_column(var = "user_id") %>%
  mutate(user_id = as.numeric(user_id))

stg_franchises <- read.csv("data/survivor/api/stg_franchises.csv")
stg_starters <- read.csv("data/survivor/api/stg_starters.csv")

surviving <- stg_starters %>%
  select(season, week, franchise_id) %>%
  distinct() %>%
  group_by(season, franchise_id) %>%
  summarise(weeks_alive = n()) %>%
  left_join(
    stg_franchises %>%
      select(season, franchise_id, user_id),
    join_by(season, franchise_id)
  ) %>%
  select(-franchise_id) %>%
  left_join(team_metadata, join_by(user_id)) %>%
  arrange(season, -weeks_alive) %>%
  relocate(season, user_id, owner_name, abbrev, weeks_alive)

write.csv(surviving,
  paste0(survivor_path_api, "v_fact_standings.csv"),
  row.names = FALSE
)
