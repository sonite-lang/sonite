# Sonite standalone installer (Windows PowerShell).
# Usage:
#   irm https://sonite.dev/install.ps1 | iex
#   $env:SONITE_VERSION='1.0.0-rc.1'; .\scripts\install.ps1
#   $env:SONITE_RELEASE_BASE='file:///C:/path/to/dist/release'; .\scripts\install.ps1

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
  Write-Host "==> $Message"
}

function Get-SoniteHome {
  if ($env:SONITE_HOME -and $env:SONITE_HOME.Trim()) {
    return $env:SONITE_HOME.Trim()
  }
  return Join-Path $env:USERPROFILE ".sonite"
}

function Get-Platform {
  if ($env:SONITE_PLATFORM -and $env:SONITE_PLATFORM.Trim()) {
    return $env:SONITE_PLATFORM.Trim()
  }
  $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
  switch ($arch) {
    "x64" { return "win32-x64" }
    "arm64" { throw "Windows ARM64 is not supported in Sonite v1. Use Windows x64." }
    default { throw "Unsupported Windows architecture: $arch" }
  }
}

function Get-Version {
  if ($env:SONITE_VERSION -and $env:SONITE_VERSION.Trim()) {
    return $env:SONITE_VERSION.Trim().TrimStart("v")
  }
  if ($env:SONITE_RELEASE_BASE -and $env:SONITE_RELEASE_BASE.Trim()) {
    throw "SONITE_VERSION is required when SONITE_RELEASE_BASE is set"
  }
  $repo = if ($env:SONITE_GITHUB_REPO) { $env:SONITE_GITHUB_REPO } else { "ethan-davies/sonite" }
  Write-Info "Resolving latest GitHub release for $repo"
  $headers = @{ "User-Agent" = "sonite-installer" }
  if ($env:GITHUB_TOKEN) {
    $headers["Authorization"] = "Bearer $($env:GITHUB_TOKEN)"
  }
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" -Headers $headers
  return $release.tag_name.TrimStart("v")
}

function Get-AssetUrls([string]$Version, [string]$Platform) {
  $archive = "sonite-$Version-$Platform.tar.gz"
  if ($env:SONITE_RELEASE_BASE -and $env:SONITE_RELEASE_BASE.Trim()) {
    $base = $env:SONITE_RELEASE_BASE.TrimEnd("/")
    return @{
      Archive = "$base/$archive"
      Sha256 = "$base/$archive.sha256"
      Name = $archive
    }
  }
  $repo = if ($env:SONITE_GITHUB_REPO) { $env:SONITE_GITHUB_REPO } else { "ethan-davies/sonite" }
  $tag = "v$Version"
  return @{
    Archive = "https://github.com/$repo/releases/download/$tag/$archive"
    Sha256 = "https://github.com/$repo/releases/download/$tag/$archive.sha256"
    Name = $archive
  }
}

function Download-File([string]$Url, [string]$Dest) {
  if ($Url.StartsWith("file://")) {
    $src = $Url.Substring(7) -replace "/", [IO.Path]::DirectorySeparatorChar
    if ($src.StartsWith("/") -and $src.Length -gt 2 -and $src[2] -eq ":") {
      # file:///C:/path
      $src = $src.Substring(1)
    }
    Copy-Item -Force $src $Dest
    return
  }
  Invoke-WebRequest -Uri $Url -OutFile $Dest
}

function Get-FileSha256([string]$Path) {
  return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLowerInvariant()
}

function Ensure-UserPath([string]$BinDir) {
  if ($env:SONITE_MODIFY_PATH -eq "0") {
    Write-Info "Add to user PATH: $BinDir"
    return
  }
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $userPath) { $userPath = "" }
  $parts = $userPath -split ";" | Where-Object { $_ -and $_.Trim() }
  if ($parts -contains $BinDir) {
    Write-Info "PATH already includes $BinDir"
    return
  }
  $newPath = if ($userPath.Trim()) { "$BinDir;$userPath" } else { $BinDir }
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  $env:Path = "$BinDir;$env:Path"
  Write-Info "Added $BinDir to user PATH"
}

$soniteHome = Get-SoniteHome
$platform = Get-Platform
$version = Get-Version
$urls = Get-AssetUrls -Version $version -Platform $platform

Write-Info "Installing Sonite $version for $platform"
Write-Info "Install root: $soniteHome"

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("sonite-install-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
  $archivePath = Join-Path $tmp "sonite.tar.gz"
  $shaPath = Join-Path $tmp "sonite.tar.gz.sha256"

  Write-Info "Downloading $($urls.Archive)"
  Download-File -Url $urls.Archive -Dest $archivePath
  Write-Info "Downloading checksum"
  Download-File -Url $urls.Sha256 -Dest $shaPath

  $expected = ((Get-Content $shaPath -Raw) -split "\s+")[0].Trim().ToLowerInvariant()
  if (-not $expected) { throw "checksum file empty" }
  $actual = Get-FileSha256 -Path $archivePath
  if ($expected -ne $actual) {
    throw "SHA-256 mismatch (expected $expected, got $actual)"
  }
  Write-Info "Checksum OK"

  $extractDir = Join-Path $tmp "extract"
  New-Item -ItemType Directory -Path $extractDir | Out-Null
  tar -xzf $archivePath -C $extractDir
  if (-not (Test-Path (Join-Path $extractDir "TOOLCHAIN.json"))) {
    throw "archive missing TOOLCHAIN.json"
  }

  New-Item -ItemType Directory -Force -Path (Join-Path $soniteHome "config") | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $soniteHome "cache") | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $soniteHome "crashes") | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $soniteHome "toolchains") | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $soniteHome "bin") | Out-Null

  $toolchainSrc = Get-ChildItem -Path (Join-Path $extractDir "toolchains") -Directory | Select-Object -First 1
  if (-not $toolchainSrc) { throw "archive missing toolchains/" }
  $toolchainName = $toolchainSrc.Name
  $toolchainDest = Join-Path $soniteHome "toolchains\$toolchainName"
  $toolchainNew = "$toolchainDest.new"
  if (Test-Path $toolchainNew) { Remove-Item -Recurse -Force $toolchainNew }
  New-Item -ItemType Directory -Path $toolchainNew | Out-Null
  Copy-Item -Recurse -Force (Join-Path $toolchainSrc.FullName "*") $toolchainNew
  if (Test-Path $toolchainDest) { Remove-Item -Recurse -Force $toolchainDest }
  Rename-Item $toolchainNew $toolchainDest

  Copy-Item -Force (Join-Path $extractDir "bin\sn.cmd") (Join-Path $soniteHome "bin\sn.cmd")
  Copy-Item -Force (Join-Path $extractDir "TOOLCHAIN.json") (Join-Path $soniteHome "TOOLCHAIN.json")

  $suffix = "-$platform"
  Get-ChildItem -Path (Join-Path $soniteHome "toolchains") -Directory | ForEach-Object {
    if ($_.Name.EndsWith($suffix) -and $_.Name -ne $toolchainName) {
      Write-Info "Removing previous toolchain $($_.Name)"
      Remove-Item -Recurse -Force $_.FullName
    }
  }

  Ensure-UserPath -BinDir (Join-Path $soniteHome "bin")

  Write-Info "Verifying installation"
  & (Join-Path $soniteHome "bin\sn.cmd") --version
  Write-Info "Sonite is ready. Open a new terminal if PATH was just updated."
}
finally {
  if (Test-Path $tmp) {
    Remove-Item -Recurse -Force $tmp
  }
}
