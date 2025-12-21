library(digest)
library(jsonlite)
library(ffscrapr)
library(tidyverse)

load_league <- function(league_name) {
  dir <- file.path("data", league_name, "api")
  tbls <- list.files(dir, pattern = "*.csv", full.names = TRUE)
  for (t in tbls) {
    assign(
      paste0(stringr::str_replace(league_name, "-", "_"),
             "_",
             substr(t, nchar(dir) + 6, nchar(t) - 4)),
      read.csv(t)
    )
  }
}

upsert <- function(new_data, file_path, key_cols, write = FALSE) {
  new_data <- new_data %>%
    dplyr::mutate(dplyr::across(tidyselect::everything(), as.character))
  if (file.exists(file_path)) {
    existing <- read.csv(file_path) %>%
      dplyr::mutate(dplyr::across(tidyselect::everything(), as.character))
    kept <- dplyr::anti_join(existing, new_data, by = key_cols)
    final <- dplyr::bind_rows(kept, new_data)
  } else {
    final <- new_data
  }
  if (write) {
    write.csv(final, file_path, row.names = FALSE)
    cat(paste0("Updated ", file_path, " (", nrow(new_data), " rows)\n"))
  } else {
    final
  }
}
