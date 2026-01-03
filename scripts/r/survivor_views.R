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
stg_schedule <- read.csv("data/survivor/api/stg_schedule.csv") %>%
  select(season, week, franchise_id, franchise_score)

surviving <- stg_starters %>%
  select(season, week, franchise_id) %>%
  distinct() %>%
  select(-week) %>%
  group_by(season, franchise_id) %>%
  mutate(weeks_alive = n()) %>%
  ungroup() %>%
  distinct() %>%
  left_join(stg_schedule,
    by = c(
      "season" = "season",
      "franchise_id" = "franchise_id",
      "weeks_alive" = "week"
    )
  ) %>%
  rowwise() %>%
  mutate(tiebreak = franchise_score / 5000) %>%
  group_by(season) %>%
  mutate(weeks_alive = row_number(weeks_alive + tiebreak)) %>%
  left_join(
    stg_franchises %>%
      select(season, franchise_id, user_id),
    join_by(season, franchise_id)
  ) %>%
  select(-c(franchise_id, franchise_score, tiebreak)) %>%
  left_join(team_metadata, join_by(user_id)) %>%
  arrange(season, -weeks_alive) %>%
  relocate(season, user_id, owner_name, abbrev, weeks_alive)

write.csv(surviving,
  paste0(survivor_path_api, "v_fact_standings.csv"),
  row.names = FALSE
)
