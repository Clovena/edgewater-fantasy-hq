source("scripts/r/utils.R")

fact_standings <- read.csv("data/sixth-city/api/fact_standings.csv")
fact_franchises <- read.csv("data/sixth-city/api/fact_franchises.csv")
v_fact_standings <- fact_standings %>%
  left_join(fact_franchises, join_by(season, franchise_id)) %>%
  select(-c(primary, secondary, tertiary, font, user_name, user_id))

write.csv(v_fact_standings,
  paste0(sixth_city_path_api, "v_fact_standings.csv"),
  row.names = FALSE
)
