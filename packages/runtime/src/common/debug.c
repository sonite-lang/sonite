#include "sn/runtime.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#else
#include <signal.h>
#include <unistd.h>
#endif

#define SN_DEBUG_MAX_FRAMES 64
#define SN_DEBUG_MAX_TASKS 256

typedef struct SnDebugFrameNode {
  SnDebugFrame frame;
  struct SnDebugFrameNode *parent;
} SnDebugFrameNode;

typedef enum SnTaskDebugState {
  SN_TASK_DEBUG_RUNNING = 0,
  SN_TASK_DEBUG_SUSPENDED = 1,
  SN_TASK_DEBUG_WAITING = 2,
  SN_TASK_DEBUG_COMPLETED = 3,
  SN_TASK_DEBUG_FAILED = 4,
  SN_TASK_DEBUG_CANCELLED = 5,
} SnTaskDebugState;

typedef struct SnTaskDebugInfo {
  int64_t id;
  const char *function;
  const char *file;
  int line;
  SnTaskDebugState state;
  const char *suspend_file;
  int suspend_line;
  const char *await_desc;
} SnTaskDebugInfo;

static _Thread_local SnDebugFrameNode *sn_debug_stack = NULL;
static SnTaskDebugInfo sn_task_debug_table[SN_DEBUG_MAX_TASKS];
static int sn_task_debug_count = 0;
static int64_t sn_task_debug_next_id = 1;
static int sn_crash_handler_installed = 0;

static void print_frame(const SnDebugFrame *f, FILE *out) {
  if (f->file != NULL && f->file[0] != '\0') {
  if (f->column > 0) {
      fprintf(out, "  at %s (%s:%d:%d)\n", f->function != NULL ? f->function : "?",
              f->file, f->line, f->column);
    } else {
      fprintf(out, "  at %s (%s:%d)\n", f->function != NULL ? f->function : "?",
              f->file, f->line);
    }
  } else if (f->function != NULL) {
    fprintf(out, "  at %s\n", f->function);
  }
}

void sn_debug_push_frame(const char *file, int line, int column, const char *function) {
  SnDebugFrameNode *node = (SnDebugFrameNode *)malloc(sizeof(SnDebugFrameNode));
  if (node == NULL) {
    return;
  }
  node->frame.file = file;
  node->frame.line = line;
  node->frame.column = column;
  node->frame.function = function;
  node->parent = sn_debug_stack;
  sn_debug_stack = node;
}

void sn_debug_pop_frame(void) {
  SnDebugFrameNode *top = sn_debug_stack;
  if (top == NULL) {
    return;
  }
  sn_debug_stack = top->parent;
  free(top);
}

int32_t sn_debug_frame_depth(void) {
  int32_t depth = 0;
  for (SnDebugFrameNode *n = sn_debug_stack; n != NULL; n = n->parent) {
    depth += 1;
  }
  return depth;
}

void sn_debug_capture_stack(char *out, int64_t out_cap, int32_t skip) {
  if (out == NULL || out_cap <= 0) {
    return;
  }
  out[0] = '\0';
  int32_t depth = 0;
  for (SnDebugFrameNode *n = sn_debug_stack; n != NULL; n = n->parent) {
  if (depth < skip) {
      depth += 1;
      continue;
    }
    char line[512];
    const SnDebugFrame *f = &n->frame;
    if (f->file != NULL && f->column > 0) {
      snprintf(line, sizeof(line), "  at %s (%s:%d:%d)\n",
               f->function != NULL ? f->function : "?", f->file, f->line, f->column);
    } else if (f->file != NULL) {
      snprintf(line, sizeof(line), "  at %s (%s:%d)\n",
               f->function != NULL ? f->function : "?", f->file, f->line);
    } else {
      snprintf(line, sizeof(line), "  at %s\n", f->function != NULL ? f->function : "?");
    }
    if ((int64_t)strlen(out) + (int64_t)strlen(line) + 1 >= out_cap) {
      break;
    }
    strcat(out, line);
    depth += 1;
  }
}

void sn_debug_print_stack(FILE *out, const char *header, int32_t skip) {
  if (header != NULL && header[0] != '\0') {
    fprintf(out, "%s\n", header);
  }
  int32_t depth = 0;
  for (SnDebugFrameNode *n = sn_debug_stack; n != NULL; n = n->parent) {
    if (depth < skip) {
      depth += 1;
      continue;
    }
    print_frame(&n->frame, out);
    depth += 1;
  }
}

const SnDebugFrame *sn_debug_top_frame(void) {
  if (sn_debug_stack == NULL) {
    return NULL;
  }
  return &sn_debug_stack->frame;
}

static void sn_panic_print(const char *kind, const char *message, const char *file,
                           int line, int column) {
  fprintf(stderr, "Sonite runtime panic\n\n");
  fprintf(stderr, "Error: %s\n", message != NULL ? message : "unknown error");
  if (kind != NULL) {
    fprintf(stderr, "Kind: %s\n", kind);
  }
  if (file != NULL && file[0] != '\0') {
    if (column > 0) {
      fprintf(stderr, "\nLocation:\n  %s:%d:%d\n", file, line, column);
    } else {
      fprintf(stderr, "\nLocation:\n  %s:%d\n", file, line);
    }
  }
  fprintf(stderr, "\nStack trace:\n");
  sn_debug_print_stack(stderr, NULL, 0);
  fprintf(stderr, "\n");
}

void sn_panic(const char *kind, const char *message, const char *file, int line,
              int column) {
  sn_panic_print(kind, message, file, line, column);
  abort();
}

void sn_panic_bounds(const char *file, int line, int column, int64_t index,
                     int64_t length) {
  fprintf(stderr, "Sonite runtime panic\n\n");
  fprintf(stderr, "Error: Array index out of bounds\n");
  fprintf(stderr, "Index: %lld\n", (long long)index);
  fprintf(stderr, "Length: %lld\n", (long long)length);
  if (file != NULL && file[0] != '\0') {
    if (column > 0) {
      fprintf(stderr, "\nLocation:\n  %s:%d:%d\n", file, line, column);
    } else {
      fprintf(stderr, "\nLocation:\n  %s:%d\n", file, line);
    }
  }
  fprintf(stderr, "\nStack trace:\n");
  sn_debug_print_stack(stderr, NULL, 0);
  fprintf(stderr, "\n");
  abort();
}

void sn_error_attach_stack(void *error, const char *stack_text) {
  if (error == NULL) {
    return;
  }
  /* Error layout: header(16) + message(8) + stackTrace(8) + cause(8) */
  char **fields = (char **)((char *)error + 16);
  fields[1] =
      stack_text != NULL ? sn_str_concat(stack_text, "") : sn_str_concat("", "");
}

char *sn_error_capture_stack_text(int32_t skip) {
  char buf[8192];
  buf[0] = '\0';
  sn_debug_capture_stack(buf, (int64_t)sizeof(buf), skip);
  return sn_str_concat(buf, "");
}

void sn_error_set_cause(void *error, void *cause) {
  if (error == NULL) {
    return;
  }
  void **fields = (void **)((char *)error + 16);
  fields[2] = cause;
}

void *sn_error_get_cause(void *error) {
  if (error == NULL) {
    return NULL;
  }
  void **fields = (void **)((char *)error + 16);
  return fields[2];
}

char *sn_error_get_stack_trace(void *error) {
  if (error == NULL) {
    return NULL;
  }
  char **fields = (char **)((char *)error + 16);
  return fields[1];
}

int64_t sn_debug_task_register(const char *function, const char *file, int line) {
  if (sn_task_debug_count >= SN_DEBUG_MAX_TASKS) {
    return -1;
  }
  SnTaskDebugInfo *info = &sn_task_debug_table[sn_task_debug_count++];
  info->id = sn_task_debug_next_id++;
  info->function = function;
  info->file = file;
  info->line = line;
  info->state = SN_TASK_DEBUG_RUNNING;
  info->suspend_file = NULL;
  info->suspend_line = 0;
  info->await_desc = NULL;
  return info->id;
}

void sn_debug_task_set_state(int64_t id, int32_t state, const char *suspend_file,
                             int suspend_line, const char *await_desc) {
  for (int i = 0; i < sn_task_debug_count; i += 1) {
    if (sn_task_debug_table[i].id == id) {
      sn_task_debug_table[i].state = (SnTaskDebugState)state;
      sn_task_debug_table[i].suspend_file = suspend_file;
      sn_task_debug_table[i].suspend_line = suspend_line;
      sn_task_debug_table[i].await_desc = await_desc;
      return;
    }
  }
}

int32_t sn_debug_task_count(void) { return sn_task_debug_count; }

const SnTaskDebugInfo *sn_debug_task_at(int32_t index) {
  if (index < 0 || index >= sn_task_debug_count) {
    return NULL;
  }
  return &sn_task_debug_table[index];
}

void sn_debug_print_async_stack(FILE *out) {
  fprintf(out, "Async stack:\n");
  for (int i = sn_task_debug_count - 1; i >= 0; i -= 1) {
    const SnTaskDebugInfo *t = &sn_task_debug_table[i];
    if (t->file != NULL) {
      fprintf(out, "  at %s (%s:%d)\n", t->function != NULL ? t->function : "?",
              t->file, t->line);
    } else {
      fprintf(out, "  at %s\n", t->function != NULL ? t->function : "?");
    }
  }
}

static void sn_native_crash_handler(int sig) {
  const char *signal_name = "UNKNOWN";
#ifndef _WIN32
  switch (sig) {
    case SIGSEGV:
      signal_name = "SIGSEGV";
      break;
    case SIGABRT:
      signal_name = "SIGABRT";
      break;
    case SIGBUS:
      signal_name = "SIGBUS";
      break;
    case SIGILL:
      signal_name = "SIGILL";
      break;
    case SIGFPE:
      signal_name = "SIGFPE";
      break;
    default:
      break;
  }
#endif
  fprintf(stderr, "Sonite application crashed.\n\n");
  fprintf(stderr, "Signal: %s\n", signal_name);
  fprintf(stderr, "Location: unknown native code\n\n");
  const SnDebugFrame *top = sn_debug_top_frame();
  if (top != NULL) {
    fprintf(stderr, "Last known Sonite frame:\n");
    print_frame(top, stderr);
    fprintf(stderr, "\n");
  }
  fprintf(stderr, "A crash report may be available under ~/.sonite/crashes/\n");
#ifndef _WIN32
  _exit(128 + sig);
#else
  ExitProcess(1);
#endif
}

#ifdef _WIN32
static LONG WINAPI sn_windows_exception_filter(EXCEPTION_POINTERS *info) {
  (void)info;
  sn_native_crash_handler(0);
  return EXCEPTION_EXECUTE_HANDLER;
}
#endif

void sn_debug_install_crash_handlers(void) {
  if (sn_crash_handler_installed) {
    return;
  }
  sn_crash_handler_installed = 1;
#ifndef _WIN32
  signal(SIGSEGV, sn_native_crash_handler);
  signal(SIGABRT, sn_native_crash_handler);
  signal(SIGBUS, sn_native_crash_handler);
  signal(SIGILL, sn_native_crash_handler);
  signal(SIGFPE, sn_native_crash_handler);
#else
  SetUnhandledExceptionFilter(sn_windows_exception_filter);
#endif
}
