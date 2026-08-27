# Contator 3D Interativo

Viewer/editor didático em Three.js para estudar o funcionamento de uma chave contatora eletromagnética industrial.

## Recursos

- modelo 3D procedural dividido em componentes independentes;
- seleção por clique ou pela árvore de componentes;
- mover, rotacionar e escalar a peça selecionada com `TransformControls`;
- zoom, órbita e pan com `OrbitControls`;
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
package.json
vite.config.js
```

## Rodar localmente

Requer Node.js 20+.

```bash
npm install
npm run dev
```

O Vite mostrará a URL local no terminal.

Para testar o build de produção:

```bash
npm run build
npm run preview
```

## Cloudflare Pages

Ao conectar este repositório ao Cloudflare Pages:

- Framework preset: `Vite` ou `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: deixe no diretório raiz do repositório

O `vite.config.js` usa `site` como raiz da aplicação e gera o resultado final em `dist`.

Depois de publicar, novos pushes na branch principal podem disparar automaticamente novos deploys.

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

O modelo atual usa geometrias procedurais para tornar cada componente imediatamente editável. A arquitetura foi deixada preparada para, em uma próxima etapa, trocar grupos específicos por meshes de um arquivo `.glb/.gltf` modelado a partir do contator real, mantendo a seleção, os controles, a vista explodida e as animações.
