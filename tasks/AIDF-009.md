# AIDF-009 — Modo escuro do editor

## Objetivo e escopo
Permitir alternar a interface do montador entre claro e escuro por um botão acessível no cabeçalho. A escolha fica salva neste navegador. O conteúdo do panfleto, suas prévias e a impressão mantêm as cores do projeto.

## Critérios de aceitação
- O botão indica a ação e o estado atual, funciona por teclado e aparece em telas pequenas.
- Cabeçalho, painéis, campos, barra flutuante e galeria são legíveis no modo escuro.
- A escolha persiste após recarregar e pode voltar ao modo claro.
- Alternar o tema não altera o documento, o rascunho, a importação/exportação ou as cores impressas.
- Se o armazenamento da preferência falhar, o tema funciona durante a sessão e o editor continua utilizável.

## Plano e risco
Adicionar estado local à interface e uma chave de preferência independente do rascunho. Aplicar cores apenas à interface; manter a folha e a prévia claras. Risco principal: regra de cor atingir cartões do panfleto. Verificar visualmente ambas as superfícies.

## Verificação
- `npm run lint`: sem erros; cinco avisos existentes.
- `npm run test:model`: 33 testes passaram.
- `npm run build`: TypeScript e build de produção passaram.
- Edge local: alternância, estado do botão, persistência após reload, galeria escura, folha branca, rascunho intacto e ausência de erros JavaScript passaram. Revisão visual em 1397 × 929 e 390 × 844 px.

## Reversão
Reverter a alteração de interface e a folha CSS; a chave de preferência é independente e pode permanecer sem afetar documentos.
