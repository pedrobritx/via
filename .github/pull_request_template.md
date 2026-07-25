## O que muda

<!-- Descreva a mudança em uma ou duas frases. -->

## Por quê

<!-- Qual problema isso resolve? Se houver issue, referencie. -->

## Impacto na metodologia

<!--
OBRIGATÓRIO quando o PR toca src/domain/.

- [ ] Alterou alguma constante em `parameters.ts`? Qual, de quanto para quanto, e com que fonte?
- [ ] Alterou alguma fórmula ou peso? `INDEX_VERSION` foi incrementado?
- [ ] Os resultados de exemplo em `docs/metodologia.md` continuam válidos?

Se o PR não toca o domínio, escreva "sem impacto".
-->

## Como verificar

<!-- Passos para reproduzir. Inclua comandos e o resultado esperado. -->

```bash
npm run test && npm run typecheck && npm run lint && npm run build
```

## Checklist

- [ ] Testes cobrem o comportamento novo ou alterado
- [ ] Constantes novas trazem `sourceId` apontando para `docs/referencias.md`
- [ ] Textos novos passaram pelo catálogo de i18n (nada hardcoded na UI)
- [ ] Navegação por teclado e contraste conferidos, se houve mudança de UI
