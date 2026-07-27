/* Spawn many short-lived async tasks. */
#include <assert.h>
#include <stdio.h>

#include "sn/runtime.h"

typedef struct Frame {
  int32_t state;
  void *sleep_fut;
  void *done_fut;
} Frame;

static void resume_worker(void *frame_ptr) {
  Frame *frame = (Frame *)frame_ptr;
  void *task = sn_task_current();
  if (frame->state == 0) {
    frame->sleep_fut = sn_timer_sleep_ms(1);
    frame->state = 1;
    sn_task_await(task, frame->sleep_fut);
    return;
  }
  if (frame->state == 1) {
    sn_future_complete_void(frame->done_fut);
    frame->state = 2;
  }
}

int main(void) {
  const int N = 100;
  sn_async_init();
  void *arr = sn_array_new(0, N, (int64_t)sizeof(void *));
  sn_gc_set_array_meta(arr, SN_REF_PTR, SN_TYPEID_FUTURE, (int64_t)sizeof(void *));
  for (int i = 0; i < N; i++) {
    void *done = sn_future_new();
    sn_array_push(arr, &done, (int64_t)sizeof(void *));
    Frame *frame = (Frame *)sn_alloc((int64_t)sizeof(Frame));
    frame->state = 0;
    frame->sleep_fut = NULL;
    frame->done_fut = done;
    sn_task_spawn(resume_worker, frame, done);
  }
  void *all = sn_future_all(arr);
  sn_event_loop_run(all);
  assert(sn_future_is_ready(all));
  sn_async_shutdown();
  printf("async_stress ok n=%d\n", N);
  return 0;
}
