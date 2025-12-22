source("scripts/r/utils.R")

playoff_json <- fromJSON(paste0(sixth_city_path_json, "playoff_seeds.json"))
playoff_seeds <- list()
for (season in names(playoff_json)) {
  playoff_seeds[[season]] <- playoff_json[[season]] %>%
    mutate(season = season)
}
playoff_seeds_df <- dplyr::bind_rows(playoff_seeds) %>%
  mutate(season = as.numeric(season))

stg_schedule <- read.csv("data/sixth-city/api/stg_schedule.csv")
stg_regular_season <- stg_schedule %>%
  filter(week <= 14)
stg_postseason_rd1 <- stg_schedule %>%
  filter(week == 15)
stg_postseason_semis <- stg_schedule %>%
  filter(week == 16)
stg_postseason_chips <- stg_schedule %>%
  filter(week == 17)

###
# Regular Season
###

regular_season <- stg_regular_season %>%
  mutate(game_type = 0)

###
# Playoffs Round 1
###

postseason_rd1 <- stg_postseason_rd1 %>%
  left_join(playoff_seeds_df, by = join_by(season, franchise_id)) %>%
  mutate(
    game_type = case_when(is.na(seed) ~ -2,
                          TRUE ~ 1)
  ) %>%
  select(-seed)

###
# Playoff Semifinals
###

postseason_semis <- stg_postseason_semis %>%
  left_join(playoff_seeds_df, join_by(season, franchise_id)) %>%
  left_join(postseason_rd1 %>%
              select(season, franchise_id, game_type, lw_result = result),
            join_by(season, franchise_id)) %>%
  mutate(game_type = case_when(
    is.na(seed) ~ -2,
    lw_result == "L" ~ -1,
    TRUE ~ 1
  )) %>%
  select(-c(seed, lw_result))

###
# Playoff Championships
###

postseason_chips <- stg_postseason_chips %>%
  left_join(playoff_seeds_df, join_by(season, franchise_id)) %>%
  left_join(postseason_semis %>%
              select(season, franchise_id,
                     lw_type = game_type, lw_result = result),
            join_by(season, franchise_id)) %>%
  mutate(game_type = case_when(
    is.na(seed) ~ -2,
    lw_type == -1 ~ -1,
    lw_result == "W" ~ 1,
    TRUE ~ -1
  )) %>%
  select(-c(seed, lw_type, lw_result))

###
# Fact Schedule
###

schedule <- rbind(
  regular_season,
  postseason_rd1,
  postseason_semis,
  postseason_chips
) %>%
  mutate(result_char = result,
         result = ifelse(result_char == "W", 1, 0)) %>%
  relocate(season, week, game_type) %>%
  arrange(season, week, -game_type, franchise_id)

write.csv(schedule,
          paste0(sixth_city_path_api, "fact_schedule.csv"), row.names = FALSE)
