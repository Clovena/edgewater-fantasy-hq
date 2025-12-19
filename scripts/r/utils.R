library(digest)
library(jsonlite)
library(ffscrapr)
library(tidyverse)

upsert <- function(new_data, file_path, key_cols, write = F) {
  new_data <- new_data %>% 
    mutate(across(everything(), as.character))
  if (file.exists(file_path)) {
    existing <- read.csv(file_path) %>% 
      mutate(across(everything(), as.character))
    kept <- anti_join(existing, new_data, by = key_cols)
    final <- bind_rows(kept, new_data)
  } else {
    final <- new_data
  }
  if (write) {
    write.csv(final, file_path, row.names = F)
    cat(paste0("Updated ", file_path, " (", nrow(new_data), " rows)\n"))
  } else {
    final
  }
}
