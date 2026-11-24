# Atlas de sprites e pipeline de animação — Universe Showdown

> Documento do formato de animação, do pipeline de arte e do inventário atual de sprites.
> **Atualizado em:** 2026-11-23.
> **Estado:** Plasmo com arte real por estado; oponente em atlas placeholder; arena procedural; sem áudio.

## 1. Decisão de formato

O projeto usa **spritesheet (atlas) controlada por código**. Cenários usam desenho procedural + camadas parallax em Canvas. Vídeo e GIF ficam descartados: não permitem pausar no frame exato da hitbox nem trocar de estado no meio do movimento.

Existem dois modelos de atlas, com o mesmo runtime:

| Modelo | Uso atual | Célula | Organização |
|---|---|---|---|
| **Placeholder procedural** | Oponente e fallback | 96 × 96 | Grade fixa 19 × 6 (1824 × 576). |
| **Arte real por estado** | Plasmo (Player 01) | Variável por estado | Uma PNG por estado, com `frameWidth`/`frameHeight`/`columns` próprios. |

O runtime (`SpriteAnimator`) não precisa saber qual modelo está em uso: cada estado pode declarar sua própria imagem e dimensões; quando não declara, herda `meta`.

## 2. Modelo placeholder — grade 96 × 96

`src/characters/animations.js` descreve a grade fixa de **19 colunas × 6 linhas** → imagem de **1824 × 576 px**. `src/characters/PlaceholderAtlas.js` desenha a atlas inteira em um canvas offscreen, com bonecos procedurais, sem arquivo de imagem.

```text
col:  0    1    2    3    4    5    6    7   ...  10  ...  15  ...  18
row 0 [idle idle idle idle|walk walk walk walk walk walk|run run run run run run ...]
row 1 [jump jump|crch crch|block block|hit hit hit| (vago) ]
row 2 [leve leve leve leve leve leve| (vago) ... ]
row 3 [médio ... 11 frames ... ]
row 4 [forte ... 19 frames ... ]
row 5 [chute ... 13 frames ... ]
```

Regras do modelo placeholder:

- Cada célula é desenhada com o personagem **de frente para a direita**.
- A base da célula é a linha do chão: `pivotY = 96`, `pivotX = 48`.
- O espelhamento para a esquerda é feito em runtime por `scale(face, 1)`.
- Frames ativos recebem uma marca ciano no topo da célula (depuração).
- Dois canvas são gerados em `Game.setupAnimators()`: um por lutador.

Estados do placeholder:

| Estado | Frames | fps/`frameTime` | Loop |
|---|---:|---|---|
| `idle` | 4 | 8 fps | Sim |
| `walk` | 6 | 12 fps | Sim |
| `run` | 6 | 20 fps | Sim |
| `jump` | 2 | 6 fps | Não |
| `crouch` | 2 | 8 fps | Sim |
| `block` | 2 | 8 fps | Não |
| `hit` | 3 | 12 fps | Não |
| `lightAttack` | 6 | 0,28/6 s | Não |
| `mediumAttack` | 11 | 0,48/11 s | Não |
| `heavyAttack` | 19 | 0,72/19 s | Não |
| `kick` | 13 | 0,52/13 s | Não |

## 3. Modelo de arte real — uma atlas por estado

Cada estado do Plasmo tem seu próprio PNG em `public/assets/characters/plasmo/`. O estado declara, em `src/characters/Plasmo.js`:

- `image`: nome do PNG;
- `frames`, `columns`;
- `frameWidth`, `frameHeight`;
- `pivotX`, `pivotY`;
- `fps` (estados cíclicos) ou `frameTime` (golpes e pulo);
- `loop`;
- `activeFrom`/`activeTo` (golpes);
- `frameAnchors` (âncora horizontal por frame).

Exemplo reduzido:

```js
idle: {
  image: 'idle.png',
  row: 0, col: 0, frames: 12, columns: 12,
  frameWidth: 320, frameHeight: 320,
  pivotX: 160, pivotY: 320,
  fps: 8, loop: true,
  frameAnchors: [154.2, 154.2, 157.9, /* ... */],
}
```

### Formato do JSON de animação

O formato continua compatível com JSON e com o template `public/assets/characters/knight/knight.json`. O runtime lê `meta.frameWidth`/`meta.frameHeight` e aceita sobrescritas por estado.

```jsonc
{
  "meta": {
    "image": "knight.png",
    "frameWidth": 96,
    "frameHeight": 96,
    "columns": 19,
    "rows": 6,
    "pivotX": 48,
    "pivotY": 96
  },
  "states": {
    "idle": {
      "row": 0, "col": 0, "frames": 4, "fps": 8, "loop": true
    },
    "lightAttack": {
      "row": 2, "col": 0, "frames": 6,
      "frameTime": 0.0467, "loop": false,
      "activeFrom": 2, "activeTo": 3
    },
    // Exemplo de sobrescrita por estado: valores de célula do Plasmo.
    "jump": {
      "row": 0, "col": 0, "frames": 25, "columns": 25,
      "frameWidth": 161, "frameHeight": 133,
      "pivotX": 80, "pivotY": 133,
      "frameTime": 0.047, "loop": false
    }
  }
}
```

| Campo | Significado |
|---|---|
| `row`, `col`, `frames` | Posição e extensão do estado na grade. |
| `columns` | Colunas da atlas do estado; usado para calcular a posição linear. |
| `frameWidth`, `frameHeight` | Tamanho da célula daquele estado. |
| `fps` | Velocidade de estados cíclicos (idle, walk, crouch) e da reação `block` (6 fps). |
| `frameTime` | Duração de **cada** frame em segundos; usada em golpes para que a animação dure exatamente a duração do golpe. |
| `loop` | Reinicia ao terminar (só idle/walk/run/crouch; `block` é one-shot, `loop: false`). |
| `activeFrom`, `activeTo` | Índices de frames ativos (contato visual). |
| `frameAnchors` | Pivô horizontal **por frame** (px dentro da célula). |

## 4. Inventário atual do Plasmo

Fonte de verdade: `src/characters/Plasmo.js`. Dimensões conferidas nos PNGs em `public/assets/characters/plasmo/`.

`meta` padrão: célula **192 × 192**, `pivotX = 96`, `pivotY = 192`.

| Estado | Arquivo | Imagem | Célula | Frames | Timing | Loop | Ativo |
|---|---|---|---:|---:|---|---|---|
| `idle` | `idle.png` | 3840 × 320 | 320 × 320 | 12 | 8 fps | Sim | — |
| `walk` | `walk.png` | 2240 × 320 | 320 × 320 | 7 | 10 fps | Sim | — |
| `run` | `walk.png` | 2240 × 320 | 320 × 320 | 7 | 20 fps | Sim | — |
| `jump` | `jump.png` | 4025 × 133 | 161 × 133 | 25 | `frameTime = 0,047` | Não | — |
| `crouch` | `crouch.png` | 3520 × 320 | 320 × 320 | 11 | 10 fps | Sim | — |
| `block` | `block.png` | 3200 × 320 | 320 × 320 | 8 (células 2→9) | 6 fps | Não | — |
| `hit` | `hit.png` | 2880 × 320 | 320 × 320 | 9 | 30 fps | Não | — |
| `lightAttack` | `lightAttack.png` | 3200 × 320 | 320 × 320 | 10 | `frameTime = 0,028` | Não | 5–7 |
| `mediumAttack` | `mediumAttack.png` | 3200 × 320 | 320 × 320 | 10 | `frameTime = 0,048` | Não | 5–6 |
| `heavyAttack` | `heavyAttack.png` | 5120 × 320 | 320 × 320 | 16 | `frameTime = 0,045` | Não | 7–11 |
| `kick` | `kick.png` | 1280 × 320 | 320 × 320 | 4 | `frameTime = 0,13` | Não | 1–2 |

Observações:

- `run` reutiliza `walk.png` a 20 fps com as mesmas âncoras; não existe sheet própria de corrida.
- `block` (sheet correta de 2026-11-23, 1 × 10, 10 poses) usa retângulos manuais por frame na extração: a grade da sheet é irregular (~120 px/pose), então o corte uniforme de `floor(1195/10)` cortaria a pose 8. O runtime consome só as células 2→9 (**8 frames**, `col: 2, frames: 8`): a pose 0–1 é o escudo se formando antes do impacto, então a reação começa já com o escudo formado e termina no último sprite — one-shot `loop: false`, disparada apenas em bloqueio bem-sucedido (`blockAnimTimer`, contrato em `tests/blockanim.test.mjs`). `hit` (sheet de 2026-11-20, 5 × 2, 9 poses) herdou a célula 320 × 320 que era do `block` — os dois estados declaram `frameWidth`/`frameHeight` próprios. `hit` roda a 30 fps para cobrir as 9 poses nos 0,3 s de hitstun.
- `jump` tem 25 frames: os 16 primeiros cobrem o tempo de ar da física; os 9 restantes são a recuperação de aterrissagem em solo (`airFrames = 16` em `Fighter.js`).
- Não há estados `victory`/`defeat` nem animação de nocaute.

## 5. Âncora por frame (`frameAnchors`)

O desenho ancora em `-anchorX`, não no centro da célula. `getFrameRect()` resolve a prioridade:

```text
frameAnchors[i] → anchorX (estado) → pivotX (meta)
```

Como o `scale(face, 1)` do renderer gira em torno desse ponto, o corpo permanece no mesmo eixo do lutador ao trocar de face — só braços e pernas trocam de lado. Sem isso, o sprite “pula” lateralmente ao virar.

- Placeholder (grade 96 × 96, corpo centrado): `pivotX = 48` já é a âncora.
- Plasmo: cada estado tem `frameAnchors` medido frame a frame como a média horizontal dos pixels visíveis (`A > 20`).
- O pulo é o caso mais crítico: o centro de massa varia dezenas de pixels entre poses (célula de 161 px).
- Regenerar após trocar os PNGs:

  ```powershell
  powershell -File scripts/measure-anchors.ps1
  ```

  Copie os arrays `anchorX` gerados para `frameAnchors` em `src/characters/Plasmo.js`.

O teste `tests/mirror.test.mjs` confere que todo estado tem `frameAnchors.length === frames`, que cada âncora está dentro da célula e que `run` reutiliza as âncoras de `walk`.

## 6. Sincronia com a hitbox

`activeFrom`/`activeTo` devem casar com `activeStart`/`activeEnd` de `ATTACKS` (`src/fighters/Fighter.js`):

```text
activeFrom ≈ floor((activeStart / duration) × frames)
activeTo   ≈ floor((activeEnd   / duration) × frames)
```

A fórmula é uma aproximação: o índice final é ajustado manualmente para coincidir com o frame em que o membro realmente alcança o alvo na arte. Por isso alguns valores da tabela não batem exatamente com o cálculo (ex.: chute).

Mapeamento atual:

| Golpe | Duração | Janela ativa | Frames | `activeFrom`–`activeTo` |
|---|---:|---:|---:|---:|
| Leve | 0,28 s | 0,14–0,22 s | 10 | 5–7 |
| Médio | 0,48 s | 0,24–0,33 s | 10 | 5–6 |
| Forte | 0,72 s | 0,32–0,50 s | 16 | 7–11 |
| Chute | 0,52 s | 0,13–0,39 s | 4 | 1–2 |

Quando o golpe for reajustado no combate, recalcular os índices aqui e em `Plasmo.js`. O critério de aceite é: **o frame de contato visual coincide com a janela em que a hitbox causa dano**.

## 7. Pipeline de desenho (runtime)

```text
Game.update(dt)  ← passo fixo 1/60 s
 ├─ Fighter.update(dt)              lógica: estado, física, hitbox
 ├─ animator.setState(f.getState()) muda de estado se necessário
 └─ animator.update(dt)             avança índice de frame (fps/frameTime)

CanvasRenderer.render()
 ├─ animator.getFrameRect()  → (sx, sy, sw, sh) da célula atual
 └─ animator.draw(ctx, x, groundY, face, scale)
      translate(x, groundY) → scale(face × scale, scale) →
      drawImage(image, sx, sy, sw, sh, -anchorX, -sh, sw, sh)
```

Pontos-chave:

- A animação avança **na simulação**, não no `requestAnimationFrame`; o frame nunca fica atrelado à taxa de renderização.
- Estados não-loop (`hit`, golpes, `jump`) congelam no último frame.
- `animator.isActive()` indica que o frame atual é de contato; o renderer usa isso para a marca visual.
- O renderer escolhe a imagem do estado atual (`stateImages.get(stateName)`) e cai para a atlas placeholder quando a arte daquele estado ainda não carregou.
- O carregamento das PNGs do Plasmo é assíncrono; o placeholder cobre o intervalo até a imagem estar disponível.

## 8. Pipeline de produção dos sprites do Plasmo

O script `scripts/extract-plasmo.ps1` documenta o processo usado:

1. Origem: spritesheets em JPEG, com fundo preto e grades variadas.
2. Chroma key para remover o fundo.
3. Recorte por bounding box de cada frame.
4. Normalização por uma escala global (`96 / 191`), preservando a proporção relativa entre poses.
5. Montagem de **uma atlas por estado**, com pés na base da célula e personagem olhando para a direita.
6. Medição das âncoras por frame com `scripts/measure-anchors.ps1`.

Limitações do pipeline:

- Os dois scripts são PowerShell e dependem de Windows.
- Os caminhos padrão apontam para a máquina do autor e precisam ser parametrizados.
- O script de extração assume JPEGs de origem e parâmetros de célula próprios; a atlas final é específica do Plasmo.
- Não há automação em CI para regenerar ou validar as imagens.

## 9. Placeholder, fallback e arte real

### Placeholder

- O oponente usa `buildPlaceholderAtlas('#ff638c')` com a grade 96 × 96.
- O Plasmo usa `buildPlaceholderAtlas('#51e3e8')` apenas como fallback inicial.
- O renderer mantém o desenho procedural antigo como fallback caso um lutador não tenha `animator` ou os dados da atlas sejam inválidos.

### Trocar o oponente por arte real

1. Produzir as PNGs por estado, olhando para a direita e com pés na base da célula.
2. Criar um arquivo de dados no formato de `src/characters/Plasmo.js` (ou um JSON compatível).
3. Em `Game.setupAnimators()`, carregar as imagens com `loadAtlasImage()` e associar cada estado com `setImage(nome, imagem)`.
4. Medir as âncoras por frame e preencher `frameAnchors`.
5. Rodar `npm test` e validar o espelhamento e a sincronia das hitboxes.

Nada muda em `SpriteAnimator` nem no renderer.

## 10. Template `knight.json`

`public/assets/characters/knight/knight.json` é apenas um **template do formato**. Não existe `knight.png` no repositório e o knight não é um personagem jogável.

Para converter uma atlas exportada pelo TexturePacker para o formato do runtime, use o script cross-platform:

```bash
node scripts/convert-texturepacker.mjs <atlas-texturepacker.json> [saida.json]
```

Convenção de nomes esperada: `<personagem>_<estado>_<índice>.png`, com frames de cada estado contíguos na mesma linha.

## 11. Origem, licença e atribuição

- A origem e a licença dos sprites do Plasmo **não estão registradas** neste documento.
- O cabeçalho de `extract-plasmo.ps1` indica que os spritesheets vieram de JPEGs (WhatsApp), mas autor, licença e permissão de uso precisam ser confirmados.
- O inventário oficial e o checklist de publicação ficam em `CREDITS.md`.
- Não publicar o jogo publicamente até que a licença do código e a origem/licença dos assets estejam regularizadas.
- Novos assets devem registrar: autor, origem, licença, URL (se houver), data e atribuição exigida.

## 12. Estrutura de arquivos

```text
src/characters/animations.js        dados da grade placeholder (formato JSON)
src/characters/PlaceholderAtlas.js  atlas procedural (oponente/fallback)
src/characters/Plasmo.js            dados da arte real do Plasmo
src/rendering/SpriteAnimator.js     controle de frames, âncoras e drawImage
public/assets/characters/knight/    knight.json (template; sem PNG)
public/assets/characters/plasmo/    PNG + JSON por estado
scripts/convert-texturepacker.mjs   conversão cross-platform de atlas
scripts/extract-plasmo.ps1          extração/normalização (Windows)
scripts/measure-anchors.ps1         medição de âncoras (Windows)
```

## 13. Manutenção

Ao alterar qualquer sprite ou janela de golpe:

1. Atualizar o PNG e os dados do estado (`frames`, `frameWidth`, `frameHeight`, `fps`/`frameTime`, `loop`, `activeFrom`/`activeTo`).
2. Regenerar `frameAnchors` e copiar os valores para o arquivo de dados.
3. Conferir a sincronia com `ATTACKS` em `Fighter.js`.
4. Rodar `npm test` — em especial `tests/mirror.test.mjs`.
5. Atualizar este documento e o inventário de `CREDITS.md` se a origem/licença mudar.
