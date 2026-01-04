source("scripts/r/utils.R")

team_metadata <- do.call(
  rbind.data.frame,
  fromJSON("data/survivor/ref/team_metadata.json")
) %>%
  tibble::rownames_to_column(var = "user_id") %>%
  mutate(user_id = as.numeric(user_id))

stg_starters <- read.csv("data/survivor/api/stg_starters.csv")
stg_schedule <- read.csv("data/survivor/api/stg_schedule.csv") %>%
  select(season, week, franchise_id, franchise_score)
stg_franchises <- read.csv("data/survivor/api/stg_franchises.csv")

standings <- stg_starters %>%
  select(season, week, franchise_id) %>%
  distinct() %>%
  select(-week) %>%
  group_by(season, franchise_id) %>%
  mutate(weeks_alive = n()) %>%
  group_by(season) %>%
  mutate(start_week = min(weeks_alive) - 1) %>%
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
  mutate(
    weeks_survived =
      row_number(weeks_alive + tiebreak) + start_week - 1
  ) %>%
  left_join(
    stg_franchises %>%
      select(season, franchise_id, user_id),
    join_by(season, franchise_id)
  ) %>%
  select(-c(franchise_score, tiebreak, weeks_alive, start_week)) %>%
  left_join(team_metadata, join_by(user_id)) %>%
  arrange(season, -weeks_survived) %>%
  relocate(season, franchise_id, user_id, owner_name, abbrev, weeks_survived)

write.csv(standings,
  paste0(survivor_path_api, "fact_standings.csv"),
  row.names = FALSE
)
