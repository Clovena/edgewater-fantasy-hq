source("scripts/r/utils.R")

###
# V_FACT_STANDINGS
###

fact_standings <- read.csv("data/survivor/api/fact_standings.csv")

v_fact_standings <- read.csv("data/survivor/api/stg_transactions.csv") %>%
  filter(type == "waiver_complete") %>%
  group_by(season, franchise_id) %>%
  summarise(faab_spent = sum(bbid_amount, na.rm = TRUE)) %>%
  right_join(fact_standings, join_by(season, franchise_id)) %>%
  arrange(season, -weeks_survived) %>%
  relocate(season, franchise_id, user_id,
           owner_name, abbrev, weeks_survived, faab_spent)

write.csv(v_fact_standings,
  paste0(survivor_path_api, "v_fact_standings.csv"),
  row.names = FALSE
)
