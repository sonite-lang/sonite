#include "sn/runtime.h"

#include <setjmp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct SnEhFrame {
  struct SnEhFrame *parent;
  jmp_buf buf;
  int has_catch;
  SnFinallyFn finally_fn;
  void *finally_ctx;
  int32_t root_checkpoint;
} SnEhFrame;

_Static_assert(sizeof(SnEhFrame) <= SN_EH_FRAME_SIZE, "SN_EH_FRAME_SIZE is too small");

static _Thread_local struct SnEhFrame *sn_eh_stack = NULL;
static _Thread_local void *sn_eh_current_exception = NULL;
static _Thread_local int sn_eh_exception_root_registered = 0;

static void ensure_exception_root(void) {
  if (!sn_eh_exception_root_registered) {
    sn_gc_set_exception_root(&sn_eh_current_exception);
    sn_eh_exception_root_registered = 1;
  }
}

void sn_eh_init_frame(void *frame, int32_t has_catch, SnFinallyFn finally_fn, void *finally_ctx) {
  SnEhFrame *f = (SnEhFrame *)frame;
  f->parent = NULL;
  f->has_catch = has_catch;
  f->finally_fn = finally_fn;
  f->finally_ctx = finally_ctx;
  f->root_checkpoint = 0;
}

void sn_eh_push(void *frame) {
  ensure_exception_root();
  SnEhFrame *f = (SnEhFrame *)frame;
  f->root_checkpoint = sn_gc_root_checkpoint();
  f->parent = sn_eh_stack;
  sn_eh_stack = f;
}

void sn_eh_pop(void *frame) {
  SnEhFrame *f = (SnEhFrame *)frame;
  if (sn_eh_stack == f) {
    sn_eh_stack = f->parent;
  }
}

void sn_eh_pop_top(void) {
  if (sn_eh_stack != NULL) {
    sn_eh_stack = sn_eh_stack->parent;
  }
}

jmp_buf *sn_eh_jmp_buf(void *frame) {
  return &((SnEhFrame *)frame)->buf;
}

void *sn_eh_caught_exception(void) {
  return sn_eh_current_exception;
}

void sn_eh_clear_exception(void) {
  sn_eh_current_exception = NULL;
}

void *sn_error_new(const char *message) {
  /* Layout: ObjectHeader (16) + message + stackTrace + cause. */
  void *err = sn_alloc(16 + (int64_t)(sizeof(void *) * 3));
  memset(err, 0, 16 + sizeof(void *) * 3);
  ((SnObjectHeader *)err)->type_id = SN_TYPEID_CLASS_BASE;
  ((SnObjectHeader *)err)->vtable = NULL;
  const char *msg = message != NULL ? message : "";
  char **fields = (char **)((char *)err + 16);
  fields[0] = sn_str_concat(msg, "");
  fields[1] = sn_str_concat("", "");
  fields[2] = NULL;
  return err;
}

static void print_error_message(void *error) {
  char *message = "";
  char *stack = NULL;
  if (error != NULL) {
    char **fields = (char **)((char *)error + 16);
    if (fields[0] != NULL) {
      message = fields[0];
    }
    if (fields[1] != NULL && fields[1][0] != '\0') {
      stack = fields[1];
    }
  }
  fprintf(stderr, "Uncaught Error: %s\n", message);
  if (stack != NULL) {
    fprintf(stderr, "\nStack trace:\n%s", stack);
    if (stack[strlen(stack) - 1] != '\n') {
      fprintf(stderr, "\n");
    }
  } else {
    fprintf(stderr, "\nStack trace:\n");
    sn_debug_print_stack(stderr, NULL, 0);
  }
  if (error != NULL) {
    void *cause = sn_error_get_cause(error);
    int depth = 0;
    while (cause != NULL && depth < 8) {
      char **cause_fields = (char **)((char *)cause + 16);
      fprintf(stderr, "\nCaused by: %s\n",
              cause_fields[0] != NULL ? cause_fields[0] : "Error");
      if (cause_fields[1] != NULL && cause_fields[1][0] != '\0') {
        fprintf(stderr, "%s", cause_fields[1]);
        if (cause_fields[1][strlen(cause_fields[1]) - 1] != '\n') {
          fprintf(stderr, "\n");
        }
      }
      cause = sn_error_get_cause(cause);
      depth += 1;
    }
  }
}

void sn_uncaught_exception(void *error) {
  print_error_message(error);
}

void sn_throw(void *error) {
  ensure_exception_root();
  if (error != NULL) {
    char *stack = sn_error_get_stack_trace(error);
    if (stack == NULL || stack[0] == '\0') {
      char *captured = sn_error_capture_stack_text(0);
      sn_error_attach_stack(error, captured);
    }
  }
  sn_eh_current_exception = error;
  struct SnEhFrame *f = sn_eh_stack;
  while (f != NULL) {
    if (f->has_catch) {
      sn_gc_root_restore(f->root_checkpoint);
      longjmp(f->buf, 1);
    }
    sn_gc_root_restore(f->root_checkpoint);
    if (f->finally_fn != NULL) {
      f->finally_fn(f->finally_ctx);
    }
    sn_eh_stack = f->parent;
    f = sn_eh_stack;
  }
  sn_uncaught_exception(error);
  abort();
}
