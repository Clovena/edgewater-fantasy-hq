source("scripts/r/utils.R")

draft_json <- fromJSON(paste0(sixth_city_path_json, "draft_slots.json"))
draft_slots <- list()
for (draft_id in names(draft_json)) {
  draft_slots[[draft_id]] <- draft_json[[draft_id]] %>%
    mutate(draft_id = as.numeric(draft_id))
}
draft_slots_df <- dplyr::bind_rows(draft_slots)

stg_draft <- read.csv("data/sixth-city/api/stg_draft.csv")

###
# Draft Calc Fields
###

draft <- stg_draft %>%
  rename(slot = pick) %>%
  left_join(draft_slots_df, join_by(draft_id, slot)) %>%
  group_by(draft_id) %>%
  mutate(overall = row_number(),
         round_pick =
           overall - (max(slot) * (ceiling(overall / max(slot) - 1))),
         round_pick_char = paste0(round, ".", sprintf("%02d", round_pick))) %>%
  ungroup() %>%
  select(draft_id, season, status, type,
         round, round_pick, round_pick_char, slot, overall,
         original_franchise_id, franchise_id, player_id, player_name) %>%
  arrange(draft_id, season, round, round_pick)

write.csv(draft,
          paste0(sixth_city_path_api, "fact_draft.csv"), row.names = FALSE)
