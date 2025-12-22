library(digest)
library(jsonlite)
library(ffscrapr)
library(tidyverse)

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

sixth_city_path_api  <- "data/sixth-city/api/"
sixth_city_path_json <- "data/sixth-city/content/"
