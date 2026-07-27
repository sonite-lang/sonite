#!/usr/bin/env bash
# Sonite standalone installer (Unix).
# Usage:
#   curl -fsSL https://sonite.dev/install.sh | sh
#   SONITE_VERSION=1.0.0-rc.1 ./scripts/install.sh
#   SONITE_RELEASE_BASE=file:///path/to/dist/release ./scripts/install.sh
set -euo pipefail

SONITE_HOME="${SONITE_HOME:-${HOME}/.sonite}"
SONITE_GITHUB_REPO="${SONITE_GITHUB_REPO:-ethan-davies/sonite}"
SONITE_VERSION="${SONITE_VERSION:-}"
SONITE_RELEASE_BASE="${SONITE_RELEASE_BASE:-}"
SONITE_PLATFORM="${SONITE_PLATFORM:-}"
INSTALL_TMP=""

cleanup() {
  if [[ -n "${INSTALL_TMP}" && -d "${INSTALL_TMP}" ]]; then
    rm -rf "${INSTALL_TMP}"
  fi
}
trap cleanup EXIT

err() {
  echo "error: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "${os}" in
    linux) os="linux" ;;
    darwin) os="macos" ;;
    *) err "unsupported OS '${os}'. Supported: Linux, macOS." ;;
  esac
  case "${arch}" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) err "unsupported architecture '${arch}'." ;;
  esac
  echo "${os}-${arch}"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || err "required command not found: $1"
}

sha256_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${file}" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${file}" | awk '{print $1}'
  else
    err "need sha256sum or shasum to verify downloads"
  fi
}

github_api() {
  local path="$1"
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    curl -fsSL -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      "https://api.github.com${path}"
  else
    curl -fsSL "https://api.github.com${path}"
  fi
}

resolve_version() {
  if [[ -n "${SONITE_VERSION}" ]]; then
    echo "${SONITE_VERSION#v}"
    return
  fi
  if [[ -n "${SONITE_RELEASE_BASE}" ]]; then
    err "SONITE_VERSION is required when SONITE_RELEASE_BASE is set"
  fi
  info "Resolving latest GitHub release for ${SONITE_GITHUB_REPO}"
  local tag
  tag="$(github_api "/repos/${SONITE_GITHUB_REPO}/releases/latest" \
    | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
    | head -n1)"
  [[ -n "${tag}" ]] || err "could not resolve latest release tag"
  echo "${tag#v}"
}

download() {
  local url="$1"
  local dest="$2"
  case "${url}" in
    file://*)
      local src="${url#file://}"
      cp "${src}" "${dest}"
      ;;
    *)
      curl -fsSL -o "${dest}" "${url}"
      ;;
  esac
}

asset_urls() {
  local version="$1"
  local platform="$2"
  local archive="sonite-${version}-${platform}.tar.gz"
  if [[ -n "${SONITE_RELEASE_BASE}" ]]; then
    local base="${SONITE_RELEASE_BASE%/}"
    echo "${base}/${archive}"
    echo "${base}/${archive}.sha256"
    return
  fi
  local tag="v${version}"
  echo "https://github.com/${SONITE_GITHUB_REPO}/releases/download/${tag}/${archive}"
  echo "https://github.com/${SONITE_GITHUB_REPO}/releases/download/${tag}/${archive}.sha256"
}

append_path_hint() {
  local bin_dir="$1"
  local profile=""
  case "${SHELL:-}" in
    */zsh) profile="${HOME}/.zshrc" ;;
    */bash) profile="${HOME}/.bashrc" ;;
    *) profile="${HOME}/.profile" ;;
  esac
  local line="export PATH=\"${bin_dir}:\$PATH\""
  if [[ -f "${profile}" ]] && grep -Fq "${bin_dir}" "${profile}" 2>/dev/null; then
    info "PATH already configured in ${profile}"
    return
  fi
  if [[ "${SONITE_MODIFY_PATH:-1}" == "1" ]]; then
    {
      echo ""
      echo "# Sonite CLI"
      echo "${line}"
    } >> "${profile}"
    info "Added ${bin_dir} to PATH in ${profile}"
  else
    info "Add to PATH: ${line}"
  fi
}

main() {
  need_cmd curl
  need_cmd tar
  need_cmd uname

  local platform version
  platform="${SONITE_PLATFORM:-$(detect_platform)}"
  version="$(resolve_version)"

  info "Installing Sonite ${version} for ${platform}"
  info "Install root: ${SONITE_HOME}"

  INSTALL_TMP="$(mktemp -d "${TMPDIR:-/tmp}/sonite-install.XXXXXX")"
  local urls archive_url sha_url archive_path sha_path expected actual
  urls="$(asset_urls "${version}" "${platform}")"
  archive_url="$(echo "${urls}" | sed -n '1p')"
  sha_url="$(echo "${urls}" | sed -n '2p')"
  archive_path="${INSTALL_TMP}/sonite.tar.gz"
  sha_path="${INSTALL_TMP}/sonite.tar.gz.sha256"

  info "Downloading ${archive_url}"
  download "${archive_url}" "${archive_path}"
  info "Downloading checksum"
  download "${sha_url}" "${sha_path}"

  expected="$(awk '{print $1}' "${sha_path}" | head -n1 | tr -d '\r')"
  [[ -n "${expected}" ]] || err "checksum file empty"
  actual="$(sha256_file "${archive_path}")"
  if [[ "${expected}" != "${actual}" ]]; then
    err "SHA-256 mismatch (expected ${expected}, got ${actual})"
  fi
  info "Checksum OK"

  local extract_dir="${INSTALL_TMP}/extract"
  mkdir -p "${extract_dir}"
  tar --no-same-owner -xzf "${archive_path}" -C "${extract_dir}"

  [[ -f "${extract_dir}/TOOLCHAIN.json" ]] \
    || err "archive missing TOOLCHAIN.json (interrupted or corrupt download)"
  [[ -d "${extract_dir}/bin" ]] \
    || err "archive missing bin/"

  mkdir -p "${SONITE_HOME}"
  # Preserve user config/cache across upgrades.
  mkdir -p "${SONITE_HOME}/config" "${SONITE_HOME}/cache" "${SONITE_HOME}/crashes"

  # Atomic-ish toolchain install: extract to staging then move.
  local toolchain_src
  toolchain_src="$(find "${extract_dir}/toolchains" -mindepth 1 -maxdepth 1 -type d | head -n1)"
  [[ -n "${toolchain_src}" ]] || err "archive missing toolchains/"
  local toolchain_name
  toolchain_name="$(basename "${toolchain_src}")"
  mkdir -p "${SONITE_HOME}/toolchains"
  local toolchain_dest="${SONITE_HOME}/toolchains/${toolchain_name}"
  rm -rf "${toolchain_dest}.new"
  mkdir -p "${toolchain_dest}.new"
  # Copy toolchain contents
  cp -a "${toolchain_src}/." "${toolchain_dest}.new/"
  rm -rf "${toolchain_dest}"
  mv "${toolchain_dest}.new" "${toolchain_dest}"

  # Refresh bin wrappers and current pointer.
  mkdir -p "${SONITE_HOME}/bin"
  if [[ -f "${extract_dir}/bin/sn" ]]; then
    cp -f "${extract_dir}/bin/sn" "${SONITE_HOME}/bin/sn"
    chmod 755 "${SONITE_HOME}/bin/sn"
  else
    err "archive missing bin/sn"
  fi
  cp -f "${extract_dir}/TOOLCHAIN.json" "${SONITE_HOME}/TOOLCHAIN.json"

  # Remove older toolchains with same platform (keep newest install).
  local plat_suffix="-${platform}"
  for dir in "${SONITE_HOME}/toolchains"/*; do
    [[ -d "${dir}" ]] || continue
    local base
    base="$(basename "${dir}")"
    if [[ "${base}" == *"${plat_suffix}" && "${base}" != "${toolchain_name}" ]]; then
      info "Removing previous toolchain ${base}"
      rm -rf "${dir}"
    fi
  done

  append_path_hint "${SONITE_HOME}/bin"

  info "Verifying installation"
  if ! "${SONITE_HOME}/bin/sn" --version >/dev/null 2>&1; then
    # Still report path for debugging; do not leave half-installed silently.
    "${SONITE_HOME}/bin/sn" --version || err "sn --version failed after install"
  fi
  local ver_out
  ver_out="$("${SONITE_HOME}/bin/sn" --version 2>/dev/null || true)"
  info "Installed: ${ver_out:-ok}"
  info "Sonite is ready. Open a new terminal or: export PATH=\"${SONITE_HOME}/bin:\$PATH\""
}

main "$@"
