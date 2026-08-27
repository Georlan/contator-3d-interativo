# Contator 3D Interativo

Viewer/editor didático em Three.js para estudar o funcionamento de uma chave contatora eletromagnética industrial.

## Recursos

- modelo 3D procedural dividido em componentes independentes;
- seleção por clique ou pela árvore de componentes;
- mover/rotacionar/escalar a peça selecionada;
- zoom, órbita e pan;
- mostrar/ocultar componentes;
- vista explodida e montagem;
- animação de bobina energizada, armadura e contatos;
- reset individual e geral;
- salvar layout no navegador;
- exportar/importar layout em JSON;
- preparado para substituir peças procedurais por modelos GLB/GLTF no futuro.

## Estrutura

```text
site/
  index.html
  styles.css
  app.js
```

O projeto é estático e não exige etapa de build.

## Rodar localmente

Sirva a pasta `site` com qualquer servidor HTTP. Exemplo:

```bash
python -m http.server 8080 -d site
```

Depois abra `http://localhost:8080`.

> Não abra o `index.html` diretamente via `file://`, pois os módulos ES do navegador precisam ser servidos por HTTP.

## Cloudflare Pages

Ao conectar este repositório ao Cloudflare Pages:

- Framework preset: `None`
- Build command: deixe vazio
- Build output directory: `site`

Depois de publicar, qualquer push na branch principal pode disparar um novo deploy.

## Controles

- mouse esquerdo: selecionar/usar gizmo;
- arrastar fora do gizmo: orbitar;
- roda do mouse: zoom;
- mouse direito: pan;
- `W`: mover;
- `E`: rotacionar;
- `R`: escalar;
- `Delete`: ocultar a peça selecionada;
- `Esc`: limpar seleção.

## Próxima evolução

O modelo atual usa geometrias procedurais para tornar cada componente imediatamente editável. A arquitetura foi deixada preparada para, em uma próxima etapa, trocar grupos específicos por meshes de um arquivo `.glb/.gltf` modelado a partir do contator real.
