source("scripts/r/utils.R")

playoff_json <- fromJSON(paste0(sixth_city_path_json, "playoff_seeds.json"))
playoff_seeds <- list()
for (season in names(playoff_json)) {
  playoff_seeds[[season]] <- playoff_json[[season]] %>%
    mutate(season = season)
}
playoff_seeds_df <- dplyr::bind_rows(playoff_seeds) %>%
  mutate(season = as.numeric(season))

stg_standings <- read.csv("data/sixth-city/api/stg_standings.csv")
standings <- stg_standings %>%
  rename(
    wins = h2h_wins,
    losses = h2h_losses,
    ties = h2h_ties,
    win_pct = h2h_winpct,
    max_points_for = potential_points,
    allplay_win_pct = allplay_winpct
  ) %>%
  mutate(
    win_pct = round(win_pct, 3),
    allplay_win_pct = round(allplay_win_pct, 3),
    accuracy = round(points_for / max_points_for, 3)
  ) %>%
  select(
    season,
    franchise_id,
    wins, losses, ties, win_pct,
    points_for, points_against,
    max_points_for, accuracy,
    allplay_wins, allplay_losses, allplay_win_pct
  ) %>%
  arrange(-season, -win_pct)

write.csv(standings,
  paste0(sixth_city_path_api, "fact_standings.csv"),
  row.names = FALSE
)
