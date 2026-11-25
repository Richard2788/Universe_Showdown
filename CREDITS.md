# Créditos, origem e licenças de assets — Universe Showdown

> Inventário de código, sprites, fontes, áudio e ferramentas de terceiros.
> **Atualizado em:** 2026-11-24.
> **Status:** a publicação pública está **bloqueada** até que a licença do código e a origem/licença dos sprites do Plasmo sejam regularizadas.

## 1. Resumo

| Categoria | Item | Origem | Licença | Status |
|---|---|---|---|---|
| Código | Aplicação Universe Showdown | Repositório GitHub `Richard2788/Universe_Showdown` | A definir (não há `LICENSE`) | Pendente |
| Personagem | Plasmo (Player 01) | Spritesheets extraídos de JPEGs; pipeline em `extract-plasmo.ps1` | Desconhecida / a confirmar | **Bloqueante** |
| Personagem | Sable (adversária da fase 3) | Spritesheets PNG com fundo transparente fornecidas pelo autor; normalizadas por `extract-sable.ps1` | Desconhecida / a confirmar | **Bloqueante** |
| Personagem | Oponente placeholder | Desenho procedural em `PlaceholderAtlas.js` | Original do projeto (a confirmar) | Provisório |
| Template | `knight.json` | Template de formato de animação | Original do projeto | Sem PNG |
| Cenário | Arena e parallax | Desenho procedural em `CanvasRenderer.js` | Original do projeto | Provisório |
| UI | HUD, menu e controles | HTML/CSS do projeto | Original do projeto | — |
| Fontes | `Inter, ui-sans-serif, system-ui` | Fontes do sistema operacional; nenhum arquivo empacotado | Respectivas licenças do sistema | — |
| Áudio | Efeitos e música | Não implementados | — | Pendente |
| Dependência | Vite 7.3.8 | npm | MIT | OK |
| Dependência | SAT.js (`sat`) 0.9.0 | npm | MIT | Declarada, não usada |

## 2. Código do projeto

- Repositório: <https://github.com/Richard2788/Universe_Showdown>
- Versão em `package.json`: `0.1.0`
- **Licença:** não há arquivo `LICENSE` no repositório. A licença do código precisa ser definida antes de qualquer distribuição pública.
- Autoria: o histórico Git e o repositório remoto identificam o mantenedor como `Richard2788`; a documentação não substitui um aviso formal de copyright.
- A definir:
  - titular do copyright;
  - licença (MIT, Apache-2.0, GPL, proprietária etc.);
  - texto de atribuição exigido;
  - política para contribuições.

**Ação necessária:** adicionar `LICENSE` na raiz e atualizar este arquivo com a decisão.

## 3. Personagens e sprites

### 3.1 Plasmo — Player 01

Arquivos em `public/assets/characters/plasmo/`:

- `idle.png` / `idle.json`
- `walk.png` / `walk.json`
- `jump.png` / `jump.json`
- `crouch.png` / `crouch.json`
- `block.png` / `block.json`
- `hit.png` / `hit.json`
- `lightAttack.png` / `lightAttack.json`
- `mediumAttack.png` / `mediumAttack.json`
- `heavyAttack.png` / `heavyAttack.json`
- `kick.png` / `kick.json`

Dados de runtime: `src/characters/Plasmo.js`.

**Origem conhecida:** o cabeçalho de `scripts/extract-plasmo.ps1` indica que os spritesheets foram extraídos de JPEGs (WhatsApp), com fundo preto, chroma key, recorte de bounding box e montagem de uma atlas por estado.

**O que ainda falta registrar:**

- autor/origem artística dos desenhos;
- licença ou cessão de uso;
- permissão para uso comercial e modificação, se aplicável;
- URL/origem dos arquivos originais;
- data de aquisição;
- atribuição exigida.

**Status:** **origem/licença a confirmar**. Não redistribuir publicamente até a regularização.

### 3.2 Sable — adversária da fase 3

Arquivos em `public/assets/characters/sable/` (11 atlas PNG, células 192 × 192):

- `idle.png`, `walk.png`, `run.png`, `jump.png`, `crouch.png`, `block.png`, `hit.png`
- `lightAttack.png`, `mediumAttack.png`, `heavyAttack.png` (o `kick` reutiliza a arte do `heavyAttack`; não há `kick.png`)

Dados de runtime: `src/characters/Sable.js`; kit em `src/characters/roster.js`.

**Origem conhecida:** spritesheets PNG com fundo transparente (uma folha por estado, com `meta.json`) fornecidas pelo autor do projeto a partir de uma pasta externa ao repositório (`spritesheets_lutadora_transparentes`); normalizadas por `scripts/extract-sable.ps1`. As folhas da fonte incluem estados não usados (`caminhando_tras`, `levante…`), omitidos por parity com o Plasmo.

**O que ainda falta registrar:**

- autor/origem artística dos desenhos (mesma questão do Plasmo: são da mesma fonte?);
- licença ou cessão de uso;
- permissão para uso comercial e modificação, se aplicável;
- URL/origem dos arquivos originais;
- data de aquisição;
- atribuição exigida.

**Status:** **origem/licença a confirmar**. Não redistribuir publicamente até a regularização.

### 3.3 Oponente placeholder

- Gerado proceduralmente por `src/characters/PlaceholderAtlas.js` em canvas offscreen.
- Cores e poses definidas em código.
- Não há arquivo de imagem externo.
- É um asset provisório, não a arte final do oponente.

**Status:** provisório; substituir por arte real e registrar a licença.

### 3.4 Template `knight.json`

- Arquivo: `public/assets/characters/knight/knight.json`.
- É apenas um template do formato de animação.
- **Não existe `knight.png`** no repositório.
- O knight não é um personagem jogável.

**Status:** template técnico; sem asset gráfico.

## 4. Cenário e efeitos

- Arena, chão, montanhas e ruínas são desenhados proceduralmente em `src/rendering/CanvasRenderer.js`.
- Não há PNG de cenário nem camadas parallax externas nesta versão.
- Efeitos de bloqueio (escudo, faíscas e anel de choque) são desenhados em Canvas.
- A marca de contato no frame ativo é um indicador visual de depuração.

**Status:** arte procedural provisória, original do projeto (a confirmar na licença do código).

## 5. Fontes

- O CSS usa `Inter, ui-sans-serif, system-ui, sans-serif`.
- Nenhum arquivo `.woff`, `.woff2` ou `.ttf` é distribuído no repositório.
- O navegador resolve a fonte localmente; não há licença de fonte a distribuir enquanto nenhum arquivo for empacotado.
- Se uma fonte for adicionada no futuro, registrar nome, versão, licença e URL.

## 6. Áudio

- Nenhum efeito sonoro, música ou voz implementado.
- Não há arquivos de áudio no repositório.
- Ao adicionar áudio:
  - registrar autor, origem e licença;
  - confirmar permissão para uso e modificação;
  - respeitar políticas de autoplay do navegador;
  - manter opção de mute/volume.

## 7. Ferramentas e dependências de terceiros

### Dependências diretas

| Pacote | Versão | Licença | Uso |
|---|---|---|---|
| `vite` | 7.3.8 | MIT | Desenvolvimento e build. |
| `sat` | 0.9.0 | MIT | Declarado, **não integrado** à colisão atual. |

### Dependências transitivas

O `package-lock.json` registra as dependências transitivas do Vite (Rollup, esbuild, PostCSS, entre outras). Todas devem ser tratadas conforme suas respectivas licenças ao distribuir a build. Verificar o lockfile e os pacotes em `node_modules` antes de publicar.

### Ferramentas de produção de arte

- A documentação sugere Aseprite, Krita, Piskel, TexturePacker e Free Texture Packer como ferramentas possíveis.
- Nenhuma dessas ferramentas é distribuída com o jogo; o uso é apenas no pipeline de produção.
- Se uma ferramenta gerar assets derivados, registrar a licença do asset final, não apenas a da ferramenta.

## 8. Atribuições

Ainda não há atribuições formais registradas no jogo ou nos documentos.

Quando houver, incluir:

- nome do autor/organização;
- título do asset;
- URL de origem;
- licença;
- texto de atribuição exigido;
- local onde a atribuição aparece (tela de créditos, README, etc.).

## 9. Checklist antes de publicar

- [ ] Definir e adicionar `LICENSE` para o código.
- [ ] Registrar autor, origem e licença dos sprites do Plasmo.
- [ ] Registrar autor, origem e licença dos sprites da Sable.
- [ ] Confirmar permissão de uso, modificação e distribuição.
- [ ] Substituir o oponente placeholder por arte com licença registrada.
- [ ] Registrar licença da arte final do cenário.
- [ ] Registrar licença de qualquer fonte empacotada.
- [ ] Registrar licença de qualquer áudio adicionado.
- [ ] Revisar licenças das dependências diretas e transitivas.
- [ ] Incluir tela ou seção de créditos, se exigido.
- [ ] Atualizar este arquivo e o `CHANGELOG.md`.
- [ ] Só então publicar no Render.

## 10. Manutenção

Cada novo asset deve entrar na tabela do resumo com, no mínimo:

| Campo | Obrigatório |
|---|---|
| Nome do asset | Sim |
| Arquivo/caminho | Sim |
| Autor/origem | Sim |
| Licença | Sim |
| URL de origem | Quando existir |
| Data de aquisição | Sim |
| Atribuição exigida | Quando existir |
| Status (provisório/final) | Sim |

A ausência de licença é um bloqueador de publicação, não um detalhe opcional.
