# measure-anchors.ps1 — mede o pivô horizontal POR FRAME de cada atlas do
# Plasmo (public/assets/characters/plasmo/<estado>.png) e emite o JSON no
# formato de `frameAnchors` de src/characters/Plasmo.js.
#
# Mérito: âncora = média horizontal dos pixels visíveis (A > 20) da célula
# (coordenada x inteira, sem peso alfa — método validado contra as âncoras
# já usadas no jogo). É o ponto que deve ficar no eixo do lutador quando o
# SpriteAnimator desenha com -anchorX — sem ele, o sprite "pula" ao virar.
#
# Uso:
#   powershell -File scripts/measure-anchors.ps1
#   powershell -File scripts/measure-anchors.ps1 [pasta-destino] [saida.json]
# Copie os arrays `anchorX` gerados para `frameAnchors` em Plasmo.js.
param(
  [string]$Src = "C:\Users\marxb\Documents\Projects\Escola\Universe_Showdown\public\assets\characters\plasmo",
  [string]$Out = "C:\Users\marxb\AppData\Local\Temp\opencode\plasmo-anchors.json"
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Estado → largura da célula de saída (mesmos valores de PLASMO_DATA).
$States = [ordered]@{
  idle = 320; walk = 320; jump = 161; crouch = 320; block = 192; hit = 192
  lightAttack = 320; mediumAttack = 320; heavyAttack = 320; kick = 320
}

$result = [ordered]@{}
foreach ($state in $States.Keys) {
  $path = Join-Path $Src "$state.png"
  if (-not (Test-Path $path)) { Write-Warning "ausente: $path"; continue }
  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  $fw = $States[$state]
  $fh = $bmp.Height          # todas as sheets são 1 fileira de células
  $frames = [int][math]::Floor($bmp.Width / $fw)
  $anchors = @()
  for ($i = 0; $i -lt $frames; $i++) {
    $count = 0; $sumX = 0
    $baseX = $i * $fw
    for ($y = 0; $y -lt $fh; $y++) {
      for ($x = 0; $x -lt $fw; $x++) {
        if ($bmp.GetPixel($baseX + $x, $y).A -gt 20) { $count++; $sumX += $x }
      }
    }
    $anchor = if ($count -gt 0) { [math]::Round($sumX / $count, 1) } else { [math]::Round($fw / 2.0, 1) }
    $anchors += $anchor
  }
  $result[$state] = @{ anchorX = $anchors; frameWidth = $fw }
  $bmp.Dispose()
  Write-Host ("{0}: {1} frames" -f $state, $frames)
}

$result | ConvertTo-Json -Depth 4 | Set-Content $Out -Encoding UTF8
Write-Host "Âncoras gravadas em $Out"
