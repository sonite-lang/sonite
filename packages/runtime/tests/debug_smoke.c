#include "sn/runtime.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void inner(void) {
  sn_debug_push_frame("src/main.sn", 10, 5, "inner");
  char buf[512];
  buf[0] = '\0';
  sn_debug_capture_stack(buf, sizeof(buf), 0);
  if (strstr(buf, "inner") == NULL || strstr(buf, "main") == NULL) {
    fprintf(stderr, "missing frames in capture:\n%s\n", buf);
    exit(1);
  }
  sn_debug_pop_frame();
}

int main(void) {
  sn_debug_push_frame("src/main.sn", 5, 1, "main");
  inner();
  sn_debug_pop_frame();
  printf("debug_smoke: ok\n");
  return 0;
}
