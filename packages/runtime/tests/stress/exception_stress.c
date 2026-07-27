/* Throw/catch in a tight loop. */
#include <setjmp.h>
#include <stdio.h>

#include "sn/runtime.h"

static void boom(int i) {
  char buf[64];
  snprintf(buf, sizeof(buf), "err-%d", i);
  sn_throw(sn_error_new(buf));
}

int main(void) {
  volatile int i;
  for (i = 0; i < 1000; i++) {
    char frame[SN_EH_FRAME_SIZE];
    sn_eh_init_frame(frame, 1, NULL, NULL);
    sn_eh_push(frame);
    if (setjmp(*sn_eh_jmp_buf(frame)) == 0) {
      boom(i);
      printf("missed catch\n");
      return 1;
    }
    void *err = sn_eh_caught_exception();
    if (!err) {
      printf("missing exception\n");
      return 1;
    }
    sn_eh_pop(frame);
  }
  printf("exception_stress ok\n");
  return 0;
}
