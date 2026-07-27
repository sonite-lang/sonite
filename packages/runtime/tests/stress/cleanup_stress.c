/* Open/close many files for cleanup coverage. */
#include <stdio.h>
#include <string.h>

#include "sn/runtime.h"

int main(void) {
  for (int i = 0; i < 200; i++) {
    char path[64];
    snprintf(path, sizeof(path), "/tmp/sonite-stress-%d.txt", i);
    if (!sn_fs_write_file(path, "x")) {
      printf("write failed %s\n", path);
      return 1;
    }
    if (!sn_fs_exists(path)) {
      printf("missing %s\n", path);
      return 1;
    }
    if (!sn_fs_delete_file(path)) {
      printf("delete failed %s\n", path);
      return 1;
    }
  }
  printf("cleanup_stress ok\n");
  return 0;
}
