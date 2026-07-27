/* GC allocation churn + forced collections. */
#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "sn/runtime.h"

int main(void) {
  sn_gc_set_threshold(64 * 1024);
  for (int round = 0; round < 50; round++) {
    void *roots[64];
    for (int i = 0; i < 64; i++) {
      char *s = sn_str_concat("stress-", "alloc");
      assert(s != NULL);
      roots[i] = s;
      sn_gc_root_push(&roots[i]);
    }
    sn_gc_collect();
    for (int i = 0; i < 64; i++) {
      assert(roots[i] != NULL);
      sn_gc_root_pop(1);
    }
    /* Drop roots and allocate garbage */
    for (int i = 0; i < 256; i++) {
      char *g = sn_str_concat("garbage", "x");
      (void)g;
    }
    sn_gc_collect();
  }
  printf("gc_stress ok bytes=%lld\n", (long long)sn_gc_bytes_allocated());
  return 0;
}
