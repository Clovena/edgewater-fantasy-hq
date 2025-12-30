source("scripts/r/utils.R")

###
# V_FACT_STANDINGS
###

fact_standings <- read.csv("data/sixth-city/api/fact_standings.csv")
fact_franchises <- read.csv("data/sixth-city/api/fact_franchises.csv")
v_fact_standings <- fact_standings %>%
  left_join(fact_franchises, join_by(season, franchise_id)) %>%
  select(-c(primary, secondary, tertiary, font, user_name, user_id))

write.csv(v_fact_standings,
  paste0(sixth_city_path_api, "v_fact_standings.csv"),
  row.names = FALSE
)


###
# V_FACT_SCHEDULE
###

fact_schedule <- read.csv("data/sixth-city/api/fact_schedule.csv")
team_conferences <- fact_franchises %>%
  select(season, franchise_id, franchise_name, owner_name, conference)
opp_conferences <- team_conferences %>%
  rename(opponent_id = franchise_id,
         opponent_name = franchise_name,
         opponent_owner_name = owner_name,
         opponent_conference = conference)

v_fact_schedule <- fact_schedule %>%
  left_join(team_conferences,
            join_by(season, franchise_id), relationship = "many-to-one") %>%
  left_join(opp_conferences,
            join_by(season, opponent_id), relationship = "many-to-one") %>%
  mutate(is_intra_conf = ifelse(conference == opponent_conference, 1, 0)) %>%
  relocate(season, week, game_type, franchise_id, franchise_name, owner_name,
           opponent_id, opponent_name, opponent_owner_name)
write.csv(v_fact_schedule,
  paste0(sixth_city_path_api, "v_fact_schedule.csv"),
  row.names = FALSE
)
