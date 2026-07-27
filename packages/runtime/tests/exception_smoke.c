#include "sn/runtime.h"

#include <setjmp.h>
#include <stdio.h>
#include <string.h>

static void callee(void) {
  void *err = sn_error_new("test error");
  sn_throw(err);
}

int main(void) {
  char frame[SN_EH_FRAME_SIZE];
  sn_eh_init_frame(frame, 1, NULL, NULL);
  sn_eh_push(frame);
  if (setjmp(*sn_eh_jmp_buf(frame)) == 0) {
    callee();
    printf("no catch\n");
  } else {
    void *err = sn_eh_caught_exception();
    char **fields = (char **)((char *)err + 16);
    printf("caught: %s\n", fields[0]);
  }
  sn_eh_pop(frame);
  return 0;
}
