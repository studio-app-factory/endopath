# Generate iOS + Android + PWA assets from listing/icon.svg and listing/splash.svg
$ErrorActionPreference = 'Stop'
$listing = $PSScriptRoot
$root = Split-Path $listing -Parent
Set-Location $root

if (-not (Test-Path 'node_modules/@capacitor/assets')) {
  Write-Host "Installing @capacitor/assets..." -ForegroundColor Cyan
  npm install --save-dev @capacitor/assets
}

if (-not (Test-Path 'assets')) {
  New-Item -ItemType Directory -Path 'assets' | Out-Null
}

$svgexport = Get-Command svgexport -ErrorAction SilentlyContinue
$inkscape  = Get-Command inkscape  -ErrorAction SilentlyContinue
$rsvg      = Get-Command rsvg-convert -ErrorAction SilentlyContinue

if ($svgexport) {
  Write-Host "Using svgexport..." -ForegroundColor Cyan
  svgexport "$listing\icon.svg" "$root\assets\icon.png" 1024:1024
  svgexport "$listing\splash.svg" "$root\assets\splash.png" 2732:2732
} elseif ($inkscape) {
  Write-Host "Using Inkscape..." -ForegroundColor Cyan
  & $inkscape -w 1024 -h 1024 "$listing\icon.svg" -o "$root\assets\icon.png"
  & $inkscape -w 2732 -h 2732 "$listing\splash.svg" -o "$root\assets\splash.png"
} elseif ($rsvg) {
  Write-Host "Using rsvg-convert..." -ForegroundColor Cyan
  & $rsvg -w 1024 -h 1024 "$listing\icon.svg" -o "$root\assets\icon.png"
  & $rsvg -w 2732 -h 2732 "$listing\splash.svg" -o "$root\assets\splash.png"
} else {
  Write-Host "No SVG-to-PNG converter found." -ForegroundColor Yellow
  Write-Host "Install one of: npm i -g svgexport  /  Inkscape  /  rsvg-convert" -ForegroundColor Yellow
  exit 1
}

Write-Host "Running @capacitor/assets generate..." -ForegroundColor Cyan
npx @capacitor/assets generate --iconBackgroundColor '#1A0E13' --splashBackgroundColor '#1A0E13' --pwa --iconBackgroundColorDark '#1A0E13' --splashBackgroundColorDark '#1A0E13'

Write-Host "Assets generated. Check ios/App/App/Assets.xcassets/ and android/app/src/main/res/" -ForegroundColor Green
