# extract-sable.ps1 — normaliza as spritesheets TRANSPARENTES da Sable em
# uma atlas PNG por estado, no mesmo formato do runtime do Plasmo:
#   - uma fileira de células 192×192 por estado em public/assets/characters/sable/;
#   - recorte por bounding box dos pixels visíveis (A > 20), sem chavear cor
#     (a fonte já tem fundo transparente);
#   - escala GLOBAL do personagem — a MESMA em todos os estados, para não
#     distorcer as poses entre si (agachar continua mais baixo que estar em pé);
#   - conteúdo centralizado na horizontal e PÉS NA BASE da célula;
#   - imprime `frameAnchors` (centro de massa por frame) para colar em
#     src/characters/Sable.js — mesmo método de scripts/measure-anchors.ps1.
#
# Escala de paridade com o Plasmo: o conteúdo de pé do Plasmo tem ~96 px
# (medido em public/assets/characters/plasmo/*.png; ver src/characters/Plasmo.js),
# então escala = 96 / altura do conteúdo de pé do idle da Sable (168 px
# na fonte atual) ≈ 0,5714. O renderScale do kit fica 1 (roster.js).
#
# Uso:
#   powershell -File scripts/extract-sable.ps1
#   powershell -File scripts/extract-sable.ps1 -Source <pasta> -Dest <pasta> -TargetHeight 96
param(
  [string]$Source = "C:\Users\marxb\Downloads\spritesheets_lutadora_transparentes\spritesheets_transparentes",
  [string]$Dest = "C:\Users\marxb\Documents\Projects\Escola\Universe_Showdown\public\assets\characters\sable",
  [int]$TargetHeight = 96,
  [int]$Cell = 192,
  [int]$VisibleThreshold = 20
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Folha da fonte → estado do runtime (chaves de SABLE_DATA.states). Estados
# da folha sem estado no runtime ficam de fora por decisão: o jogo anda para
# trás com a sheet de walk espelhada e levanta com idle, como o Plasmo
# (caminhando_tras e levantando documentados em ASSETS-ATLAS.md).
$Map = [ordered]@{
  idle        = 'idle'
  caminhando  = 'walk'
  correndo    = 'run'
  pulo        = 'jump'
  agachando   = 'crouch'
  bloqueio    = 'block'
  dano        = 'hit'
  soco_fraco  = 'lightAttack'
  soco_medio  = 'mediumAttack'
  soco_forte  = 'heavyAttack'
}

$metaPath = Join-Path $Source 'meta.json'
if (-not (Test-Path $metaPath)) { throw "meta.json não encontrada em $Source" }
$meta = Get-Content $metaPath -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

function Get-ContentBox {
  # Bounding box dos pixels visíveis de uma região da folha.
  param($bmp, [int]$x0, [int]$y0, [int]$w, [int]$h)
  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      if ($bmp.GetPixel($x0 + $x, $y0 + $y).A -gt $VisibleThreshold) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) { return $null }
  return @{ x = $minX; y = $minY; w = $maxX - $minX + 1; h = $maxY - $minY + 1 }
}

# ── Escala global: altura de pé do idle como referência de paridade ──
$idleMeta = $meta.idle
if (-not $idleMeta) { throw 'meta.json sem estado idle' }
$refSheet = [System.Drawing.Bitmap]::FromFile((Join-Path $Source 'idle.png'))
$refHeight = 0
for ($i = 0; $i -lt $idleMeta.frames; $i++) {
  $box = Get-ContentBox $refSheet ($i * $idleMeta.frame_w) 0 $idleMeta.frame_w $idleMeta.frame_h
  if ($box -and $box.h -gt $refHeight) { $refHeight = $box.h }
}
$refSheet.Dispose()
if ($refHeight -le 0) { throw 'idle sem conteúdo visível na fonte' }
$scale = $TargetHeight / $refHeight
Write-Host ("escala global = {0} / {1} = {2:N4} (paridade com o Plasmo)" -f $TargetHeight, $refHeight, $scale)

# ── Por estado: recorta, escala, centraliza, pés na base, mede âncoras ──
foreach ($sourceName in $Map.Keys) {
  $stateName = $Map[$sourceName]
  $stateMeta = $meta.$sourceName
  if (-not $stateMeta) { throw "meta.json sem estado $sourceName" }
  $sheetPath = Join-Path $Source "$sourceName.png"
  if (-not (Test-Path $sheetPath)) { throw "folha ausente: $sheetPath" }
  $sheet = [System.Drawing.Bitmap]::FromFile($sheetPath)
  $expected = $stateMeta.frames * $stateMeta.frame_w
  if ($sheet.Width -ne $expected -or $sheet.Height -ne $stateMeta.frame_h) {
    throw ("{0}: folha {1}x{2} ≠ meta {3}x{4}" -f $sourceName, $sheet.Width, $sheet.Height, $expected, $stateMeta.frame_h)
  }

  $atlas = New-Object System.Drawing.Bitmap ($Cell * $stateMeta.frames), $Cell
  $graphics = [System.Drawing.Graphics]::FromImage($atlas)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = 'HighQualityBicubic'
  $graphics.PixelOffsetMode = 'HighQuality'

  for ($i = 0; $i -lt $stateMeta.frames; $i++) {
    $box = Get-ContentBox $sheet ($i * $stateMeta.frame_w) 0 $stateMeta.frame_w $stateMeta.frame_h
    if (-not $box) { throw "$sourceName frame $i sem pixels visíveis" }
    $drawW = [Math]::Max(1, [Math]::Round($box.w * $scale))
    $drawH = [Math]::Max(1, [Math]::Round($box.h * $scale))
    $drawX = [Math]::Round(($Cell - $drawW) / 2)          # centraliza na horizontal
    $drawY = $Cell - $drawH                               # pés na base da célula
    $graphics.DrawImage($sheet,
      ([System.Drawing.Rectangle]::new($i * $Cell + $drawX, $drawY, $drawW, $drawH)),
      $box.x, $box.y, $box.w, $box.h,
      [System.Drawing.GraphicsUnit]::Pixel)
  }
  $graphics.Dispose()

  # frameAnchors: centro de massa horizontal por frame na célula de SAÍDA.
  $anchors = @()
  for ($i = 0; $i -lt $stateMeta.frames; $i++) {
    $count = 0; $sumX = 0
    for ($y = 0; $y -lt $Cell; $y++) {
      for ($x = 0; $x -lt $Cell; $x++) {
        if ($atlas.GetPixel($i * $Cell + $x, $y).A -gt $VisibleThreshold) { $count++; $sumX += $x }
      }
    }
    $anchors += $(if ($count -gt 0) { [math]::Round($sumX / $count, 1) } else { [math]::Round($Cell / 2.0, 1) })
  }

  $out = Join-Path $Dest "$stateName.png"
  $atlas.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $atlas.Dispose(); $sheet.Dispose()
  Write-Host ("{0}: {1} frames, célula {2}x{2} -> {3}" -f $stateName, $stateMeta.frames, $Cell, $out)
  Write-Host ("  frameAnchors: [{0}]" -f ($anchors -join ', '))
}

# kick não tem arte própria na fonte: o estado usa a sheet do heavyAttack
# (substituição explícita em Sable.js, como run→walk no Plasmo). Remove a
# cópia gerada por versões antigas do script para não deixar arquivo órfão.
$kick = Join-Path $Dest 'kick.png'
if (Test-Path $kick) { Remove-Item $kick -Force; Write-Host 'kick.png removido (kick usa heavyAttack.png)' }

Write-Host 'Próximo passo: colar frameAnchors em src/characters/Sable.js'
