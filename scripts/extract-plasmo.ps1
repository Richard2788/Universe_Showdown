# extract-plasmo.ps1 — extrai os spritesheets do Plasmo (JPEGs do WhatsApp,
# fundo preto, grades variadas), aplica chroma key, recorta o bounding box
# e monta UMA atlas por estado no formato do runtime do jogo
# (public/assets/characters/plasmo/).
#
# Uso: powershell -File scripts/extract-plasmo.ps1 [origem] [destino-pasta]
param(
  [string]$Source = "C:\Users\marxb\Downloads\plasmo_spritesheets",
  [string]$Dest = "C:\Users\marxb\Documents\Projects\Escola\Universe_Showdown\public\assets\characters\plasmo"
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$CELL = 192
$FRAMES = 8
# Escala global única: o estado mais alto (idle, ~191px de conteúdo) passa a
# ~96px (metade). Aplicada a TODOS os estados, preserva a proporção relativa
# entre as poses (crouch mais baixo, kick esticado, etc.).
$CONTENT_SCALE = 96 / 191

function Build-State {
  param(
    [string]$State, [string]$File, [int]$Cols, [int]$Rows,
    [string[]]$Cells,   # lista "linha,coluna" na ordem dos frames
    [hashtable]$Meta,   # timing (fps/frameTime/activeFrom/activeTo/loop)
    [double]$ScaleToHeight = 0, # normaliza a altura do conteúdo (estados pequenos)
    [double]$UniformScale = 1,  # escala uniforme do estado inteiro (proporção preservada)
    [switch]$CellAnchor,        # preserva a posição do conteúdo DENTRO da célula
                                # (layout da sheet) em vez de ancorar embaixo-no-centro
    [int]$CellSize = 192        # células maiores p/ estados que precisam de upscale
  )
  $path = Join-Path $Source $File
  $sheet = [System.Drawing.Bitmap]::FromFile($path)
  $cellW = [int][math]::Floor($sheet.Width / $Cols)
  $cellH = [int][math]::Floor($sheet.Height / $Rows)

  # Escala final do conteúdo (global × uniforme do estado).
  $k = $CONTENT_SCALE * $UniformScale
  # Dimensões da célula de saída: no modo CellAnchor a célula reproduz a
  # célula da origem escalada — a posição relativa de cada sprite é mantida.
  if ($CellAnchor) {
    if ($ScaleToHeight -gt 0) { throw "$State`: CellAnchor não combina com ScaleToHeight" }
    $OutW = [int][math]::Round($cellW * $k)
    $OutH = [int][math]::Round($cellH * $k)
  } else {
    $OutW = $CellSize; $OutH = $CellSize
  }

  # Atributos de desenho: chroma key por FAIXA (torna o fundo preto do
  # JPEG — e o ruído escuro da compressão — transparente no draw).
  $attr = New-Object System.Drawing.Imaging.ImageAttributes
  $attr.SetColorKey([System.Drawing.Color]::FromArgb(255, 0, 0, 0),
                    [System.Drawing.Color]::FromArgb(255, 45, 45, 45))

  $n = $Cells.Count
  $atlas = New-Object System.Drawing.Bitmap ($OutW * $n), $OutH
  $g = [System.Drawing.Graphics]::FromImage($atlas)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear([System.Drawing.Color]::Transparent)

  for ($i = 0; $i -lt $n; $i++) {
    $parts = $Cells[$i].Split(',')
    if ($parts.Count -ge 4) {
      # Retângulo manual na origem: "x,y,largura,altura" (para sprites que
      # transbordam a grade — ex.: arco do pulo).
      $sx = [int]$parts[0]; $sy = [int]$parts[1]
      $srcW = [int]$parts[2]; $srcH = [int]$parts[3]
    } else {
      $sr = [int]$parts[0]; $sc = [int]$parts[1]
      $sx = $sc * $cellW; $sy = $sr * $cellH
      $srcW = $cellW; $srcH = $cellH
    }
    # Origem do frame na atlas de saída (célula OutW × OutH).
    $x = $i * $OutW

    # ── Modo CellAnchor: desenha o retângulo inteiro escalado, mantendo a
    #    posição relativa do conteúdo dentro da célula da origem. Os sprites
    #    "flutuantes" (bolas do pulo) ficam no alto da célula, como na sheet.
    if ($CellAnchor) {
      $cellAbsX = [int][math]::Floor($sx / $cellW) * $cellW
      $cellAbsY = [int][math]::Floor($sy / $cellH) * $cellH
      $destX = $x + [int][math]::Round(($sx - $cellAbsX) * $k)
      $destY = [int][math]::Round(($sy - $cellAbsY) * $k)
      $destW = [int][math]::Round($srcW * $k)
      $destH = [int][math]::Round($srcH * $k)
      if ($destW -gt $OutW -or $destH -gt $OutH) { throw "$State frame ${i}: rect ($destW x $destH) excedeu a celula ($OutW x $OutH px)" }
      $g.DrawImage($sheet, ([System.Drawing.Rectangle]::new($destX, $destY, $destW, $destH)),
                   $sx, $sy, $srcW, $srcH, 'Pixel', $attr)
      Write-Host ("{0} frame {1}: ancora-celula {2}x{3}@{4},{5}" -f $State, $i, $destW, $destH, $destX, $destY)
      continue
    }

    # 1) Escala UNIFORME da célula para caber em $CellSize, SEM aumentar
    #    além da resolução nativa (fit ≤ 1) — evita upscale duplo com a
    #    escala global. Fundo removido via color key.
    $fit = [math]::Min(1, [math]::Min($OutW / $srcW, $OutH / $srcH))
    $tw = [int][math]::Floor($srcW * $fit); $th = [int][math]::Floor($srcH * $fit)
    $tmp = New-Object System.Drawing.Bitmap $tw, $th
    $tg = [System.Drawing.Graphics]::FromImage($tmp)
    $tg.InterpolationMode = 'HighQualityBicubic'
    $tg.PixelOffsetMode = 'HighQuality'
    $tg.DrawImage($sheet, ([System.Drawing.Rectangle]::new(0, 0, $tw, $th)),
                  $sx, $sy, $srcW, $srcH, 'Pixel', $attr)
    $tg.Dispose()

    # 2) Bounding box do conteúdo (pixels visíveis).
    $minX = $tw; $minY = $th; $maxX = -1; $maxY = -1
    for ($py = 0; $py -lt $th; $py++) {
      for ($px = 0; $px -lt $tw; $px++) {
        if ($tmp.GetPixel($px, $py).A -gt 0) {
          if ($px -lt $minX) { $minX = $px }
          if ($px -gt $maxX) { $maxX = $px }
          if ($py -lt $minY) { $minY = $py }
          if ($py -gt $maxY) { $maxY = $py }
        }
      }
    }
    $sw = $maxX - $minX + 1; $sh = $maxY - $minY + 1
    if ($sw -gt $OutW) { throw "$State frame ${i}: conteudo ($sw px) mais largo que a celula ($OutW px)" }

    # 3) Copia o recorte ancorado embaixo-no-centro (pés na base, pivô central),
    #    aplicando a escala global única + escala uniforme do estado
    #    (mesma proporção para todos os frames do estado).
    $destW = [int][math]::Floor($sw * $CONTENT_SCALE * $UniformScale)
    $destH = [int][math]::Floor($sh * $CONTENT_SCALE * $UniformScale)
    if ($ScaleToHeight -gt 0) {
      # Normaliza a altura (ex.: estados com células grandes demais na origem),
      # também na escala global.
      $target = [int][math]::Floor($ScaleToHeight * $CONTENT_SCALE)
      if ($destH -ne $target) {
        $factor = $target / $destH
        $destW = [int][math]::Floor($destW * $factor)
        $destH = $target
      }
    }
    if ($destW -gt $OutW -or $destH -gt $OutH) { throw "$State frame ${i}: conteudo ($destW x $destH) excedeu a celula ($OutW px)" }
    $destX = $x + [int][math]::Floor(($OutW - $destW) / 2)
    $destY = $OutH - $destH
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.DrawImage($tmp, ([System.Drawing.Rectangle]::new($destX, $destY, $destW, $destH)),
                 $minX, $minY, $sw, $sh, 'Pixel', $null)
    $tmp.Dispose()
    Write-Host ("{0} frame {1}: conteudo {2}x{3}px" -f $State, $i, $destW, $destH)
  }
  $g.Dispose(); $attr.Dispose(); $sheet.Dispose()

  $outPng = Join-Path $Dest ("{0}.png" -f $State)
  $atlas.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
  $atlas.Dispose()

  # JSON no formato do runtime (uma linha por estado na própria atlas).
  $metaOut = @{
    image       = "$State.png"
    frameWidth  = $OutW
    frameHeight = $OutH
    columns     = $n
    rows        = 1
    pivotX      = [int]($OutW / 2)
    pivotY      = $OutH
  }
  $entry = @{ row = 0; col = 0; frames = $n; loop = $true }
  foreach ($k in $Meta.Keys) { $entry[$k] = $Meta[$k] }
  $states = @{ $State = $entry }
  @{ meta = $metaOut; states = $states } |
    ConvertTo-Json -Depth 5 | Set-Content (Join-Path $Dest ("{0}.json" -f $State)) -Encoding UTF8
  Write-Host ("{0}: {1} frames -> {2}" -f $State, $n, $outPng)
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null

# ── Manifesto: estado → sheet, grade e células (na ordem da animação) ──
# Idle: sheet nova (célula 200x200) — as poses de braço estendido preenchem
# toda a largura da célula; -CellSize 320 evita o throw sem mudar proporção
# (o bbox é aparado e a escala global aplicada depois).
Build-State 'idle'        'WhatsApp Image 2026-11-17 at 18.28.55.jpeg'      8 2 @('0,0','0,1','0,2','0,3','0,4','0,5','0,6','0,7','1,0','1,1','1,2','1,3') @{ fps = 8 } -CellSize 320
Build-State 'walk'        'WhatsApp Image 2026-11-17 at 18.28.54 (2).jpeg'  5 2 @('0,0','0,1','0,2','0,3','0,4','1,0','1,1') @{ fps = 10 } -ScaleToHeight 191 -CellSize 320
# Pulo: arco completo da sheet 5×5 — TODOS os 25 sprites, sem duplicatas.
# Retângulos manuais (x,y,l,a) com margem de 2px (conteúdo medido por célula
# de 320×264). -CellAnchor preserva a posição de cada sprite DENTRO da célula
# (as bolas ficam no alto da célula, como na sheet — não ancoradas no chão).
# frameTime 0,047: 16 frames de ar = 0,75 s (tempo de ar do pulo, vy 560 /
# g 1500) e 9 frames de aterrissagem rodam em solo (recovery no Fighter.js).
Build-State 'jump'        'WhatsApp Image 2026-11-17 at 18.28.54 (1).jpeg'  5 5 @(
  '6,107,314,143',   '358,96,251,165',  '695,97,227,167',  '1047,43,136,209', '1367,43,136,209',  # agacha x3, lança x2
  '123,289,91,198',  '443,289,91,198',  '754,290,108,101', '1075,290,107,101','1393,299,103,95',  # sobe x2, bola x3
  '113,563,103,95',  '433,563,103,95',  '724,528,122,189', '1006,577,152,202','1326,577,152,202', # bola x2, abre, cai x2
  '13,957,218,93',   '330,1013,225,40', '650,1013,224,40', '977,928,237,128', '1297,928,236,128', # splat, poça x2, reforma x2
  '15,1172,205,142', '336,1172,204,142','640,1122,253,182','992,1119,179,180','1300,1103,221,200' # engatinha x2, levanta x3
) @{ frameTime = 0.0470; loop = $false } -CellAnchor
# Crouch: sheet com célula 200px — frame mais largo (199px) não cabe em 192.
Build-State 'crouch'      'WhatsApp Image 2026-11-17 at 18.28.54 (3).jpeg'  8 2 @('0,0','0,1','0,2','0,3','0,4','0,5','0,6','0,7','1,0','1,1','1,2') @{ fps = 10 } -CellSize 320
Build-State 'block'       'WhatsApp Image 2026-11-17 at 18.28.53.jpeg'      4 8 @('2,0','2,1','2,2','2,3') @{ fps = 6 } -ScaleToHeight 160
Build-State 'hit'         'WhatsApp Image 2026-11-17 at 18.28.53.jpeg'      4 8 @('1,1','1,2','1,3') @{ fps = 12; loop = $false } -ScaleToHeight 160
Build-State 'lightAttack'  'WhatsApp Image 2026-11-17 at 18.28.54.jpeg'     5 2 @('0,0','0,1','0,2','0,3','0,4','1,0','1,1','1,2','1,3','1,4') @{ frameTime = 0.0280; loop = $false; activeFrom = 5; activeTo = 7 } -ScaleToHeight 191 -CellSize 320
# Ataque médio: o frame original '0,6' (rastro azul) é cortado pelas bordas
# da célula na origem (sprites consecutivos se sobrepõem) — foi removido.
# 10 frames, sincronizados com ATTACKS.mediumAttack em Fighter.js.
Build-State 'mediumAttack' 'WhatsApp Image 2026-11-17 at 18.28.53 (2).jpeg' 8 2 @('0,0','0,1','0,2','0,3','0,4','0,5','0,7','1,0','1,1','1,2') @{ frameTime = 0.0480; loop = $false; activeFrom = 5; activeTo = 6 } -ScaleToHeight 191 -CellSize 320
Build-State 'heavyAttack'  'WhatsApp Image 2026-11-17 at 18.28.53 (1).jpeg' 5 4 @('0,0','0,1','0,2','0,3','0,4','1,0','1,1','1,2','1,3','1,4','2,0','2,1','2,2','2,3','2,4','3,0') @{ frameTime = 0.0450; loop = $false; activeFrom = 7; activeTo = 11 } -ScaleToHeight 191 -CellSize 320
Build-State 'kick'        'WhatsApp Image 2026-11-17 at 18.28.53.jpeg'      4 8 @('6,3','7,0','7,1','7,2') @{ frameTime = 0.1300; loop = $false; activeFrom = 1; activeTo = 2 } -ScaleToHeight 191 -CellSize 320

Write-Host "Todas as atlas foram geradas em $Dest"
