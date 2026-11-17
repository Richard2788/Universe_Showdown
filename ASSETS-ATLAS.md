# Atlas de sprites e pipeline de animação — Universe Showdown

## Decisão

Personagens e efeitos usam **spritesheet (atlas) controlada por código**.
Cenários usam desenho procedural + camadas parallax em PNG estático.
Vídeo e GIF ficam descartados: não permitem pausar no frame exato da
hitbox nem trocar de estado no meio do movimento.

## Layout da atlas

Grade fixa de células de **96 × 96 px**, organizada em **19 colunas × 6 linhas**
→ imagem final de **1824 × 576 px** (uma atlas por personagem).

O estado do personagem define onde ele começa na grade (`row`, `col`) e
quantas células ocupa (`frames`). Cada estado lê da esquerda para a direita.

```text
col:  0    1    2    3    4    5    6    7   ...        18
row 0 [idle idle idle idle|walk walk walk walk walk walk ... ]
row 1 [jump jump|crch crch|block block|hit hit hit| (vago) ]
row 2 [leve leve leve leve leve leve| (vago) ... ]
row 3 [médio ... 11 frames ... ]
row 4 [forte ... 19 frames ... ]
row 5 [chute ... 13 frames ... ]
```

Cada célula é desenhada com o personagem **de frente para a direita**,
**ancorado na base da célula** (linha do chão em `pivotY = 96`,
centro horizontal em `pivotX = 48`). O espelhamento para a esquerda é
feito em runtime pelo `scale(face, 1)` do renderer.

## Formato do JSON de animação

Fonte da verdade em runtime: `src/characters/animations.js`
(mesmo formato do template `public/assets/characters/knight/knight.json`).

```jsonc
{
  "meta": { "image": "knight.png", "frameWidth": 96, "frameHeight": 96,
            "columns": 19, "rows": 6, "pivotX": 48, "pivotY": 96 },
  "states": {
    "idle":  { "row": 0, "col": 0, "frames": 4, "fps": 8, "loop": true },
    "lightAttack": { "row": 2, "col": 0, "frames": 6, "frameTime": 0.0467,
                     "loop": false, "activeFrom": 2, "activeTo": 3 }
  }
}
```

| Campo | Significado |
|---|---|
| `row`, `col`, `frames` | posição e extensão do estado na grade |
| `fps` | velocidade de estados cíclicos (idle, walk...) |
| `frameTime` | duração de **cada** frame em segundos; usada em golpes para que a animação dure exatamente a duração do golpe (`frameTime = duration / frames`) |
| `loop` | reinicia ao terminar (só idle/walk/crouch/block) |
| `activeFrom`, `activeTo` | índices de frames ativos (contato visual) |

### Regra de sincronia com hitbox

`activeFrom/To` devem casar com `activeStart/activeEnd` de `ATTACKS`
(`src/fighters/Fighter.js`):

```text
activeFrom ≈ round((activeStart / duration) × frames)
activeTo   ≈ round((activeEnd   / duration) × frames)
```

Quando o golpe for reajustado no combate, recalcular os índices aqui.
O critério de aceite (PLANO-DE-MELHORIAS.md) é: o frame de contato visual
coincide com a janela em que a hitbox causa dano.

## Pipeline de desenho dos frames (runtime)

```text
Game.update(dt)  ← passo fixo 1/60 s
 ├─ Fighter.update(dt)            lógica: estado, física, hitbox
 ├─ animator.setState(f.getState())  muda de estado se necessário
 └─ animator.update(dt)           avança índice de frame (fps/frameTime)

CanvasRenderer.render()
 ├─ animator.getFrameRect()  → (sx, sy, 96, 96) célula atual na atlas
 └─ animator.draw(ctx, x, groundY, face)
      translate(x, groundY) → scale(face) →
      drawImage(atlas, sx, sy, 96, 96, -48, -96, 96, 96)
```

Pontos-chave:

- A animação avança **na simulação**, não no `requestAnimationFrame` —
  o avanço do frame nunca fica atrelado à taxa de renderização.
- Estados não-loop (`hit`, golpes, `jump`) congelam no último frame.
- `animator.isActive()` indica que o frame atual é de contato — usado
  pelo renderer para efeito visual e, futuramente, para validar hitbox.

## Fase atual: atlas placeholder

`src/characters/PlaceholderAtlas.js` **desenha a atlas inteira em um
canvas offscreen** com bonecos procedurais, no mesmo layout da arte final.
Isso permite testar o pipeline hoje, sem nenhum arquivo de imagem:

- 2 canvas gerados (uma cor por lutador) em `Game.setupAnimators()`;
- frames ativos marcados com um traço ciano no topo da célula (depuração);
- o `CanvasRenderer` mantém o desenho procedural antigo como fallback
  caso algum lutador não tenha animator.

## Fase de arte real (como substituir)

1. Desenhar cada pose do personagem em 96 × 96 px, pés na base da célula,
   olhando para a direita (ferramentas: Aseprite, Krita, Piskel).
2. Montar a atlas na grade 19 × 6 respeitando o mapa de estados
   (TexturePacker, Free Texture Packer, ou montagem manual).
3. Exportar PNG com transparência em `public/assets/characters/knight/knight.png`.
4. Em `Game.setupAnimators()`, trocar `buildPlaceholderAtlas(cor)` por:

   ```js
   import { loadAtlasImage } from '../rendering/SpriteAnimator.js';
   const atlas = await loadAtlasImage('/assets/characters/knight/knight.png');
   ```

   Nada mais muda: `SpriteAnimator`, JSON e renderer são os mesmos.

## Estrutura de arquivos

```text
src/characters/animations.js        dados de animação (formato JSON)
src/characters/PlaceholderAtlas.js  atlas procedural (temporária)
src/rendering/SpriteAnimator.js     controle de frames + drawImage
public/assets/characters/knight/    knight.json (template) + knight.png (futuro)
```
