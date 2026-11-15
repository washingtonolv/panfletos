# AIDF-003 — Validar projetos JSON antes da importação

Data: 2026-11-15. Implementação, testes e deploy autorizados pelo responsável.

## Problema e objetivo
A normalização anterior aceitava identificadores repetidos, quantidades inválidas e tipos inconsistentes, ou descartava fotos silenciosamente. Agora o arquivo inteiro é validado antes de criar uma alteração no editor.

## Plano e escopo
Adicionar src/project-import.ts; integrar ao comando Abrir projeto; testar arquivos válidos, malformados e incompatíveis; documentar o contrato. Preservar recuperação de rascunhos, exportação, modos legados, impressão, dependências e workflow.

## Contrato e decisões
- Arquivo JSON UTF-8 de até 50 MiB; BOM inicial aceito. Extensão ou MIME não substitui a validação do conteúdo.
- Objeto com frente e verso como listas; listas vazias são permitidas.
- Blocos com id de texto não vazio e único em todo o documento, tipo conhecido, nome de texto e altura numérica positiva e finita.
- row, hero2 e hero3 aceitam de um a cinco produtos, como os controles atuais. Se cols estiver presente, deve ser inteiro e corresponder à quantidade. Não exigir três produtos em hero3: o editor permite adicionar/remover.
- Cabeçalhos e rodapés não contêm produtos; cols, quando presente, é zero. Cabeçalhos precisam de ao menos dois campos; rodapés, ao menos um.
- Produtos exigem marca, nome, de, por e complemento como textos; etiqueta opcional deve ser conhecida.
- Foto opcional: PNG/JPEG/WebP base64 válido ou URL HTTP/HTTPS sintaticamente válida, sem espaços nem credenciais. Não verifica disponibilidade remota ou decodificação real dos pixels.
- Campos são objetos com chave não vazia e única dentro do bloco, rótulo e valor textuais. Blocos duplicados podem reutilizar chaves de campos entre si, preservando exportações atuais.
- Metadados históricos extras são ignorados pela normalização; campos conhecidos não são convertidos silenciosamente.
- A tarefa valida o formato textual dos preços; regras numéricas/comerciais são a próxima prioridade, não foram introduzidas aqui.

## Critérios de aceitação
- [x] Arquivo inválido informa motivo e localização, mantendo documento, seleção e histórico.
- [x] Rascunho salvo permanece intacto após importações rejeitadas.
- [x] Rejeitar ids repetidos, produtos fora de 1–5, tipos incorretos, campos incompletos e fotos inválidas.
- [x] Aceitar exportações atuais, conteúdo inicial com metadados antigos, cinco etiquetas, fotos e lados vazios.
- [x] Importação válida pode ser desfeita/refeita e persiste após recarregar.
- [x] Rejeitar arquivos maiores que 50 MiB antes da leitura e informar falha de leitura.
- [x] Permitir escolher novamente o mesmo arquivo após erro.
- [x] Leitura demorada não sobrescreve novas edições; seleção mais recente prevalece.
- [x] 19 testes de modelo passaram, incluindo matrizes de casos inválidos e de compatibilidade; lint sem erros e com cinco avisos existentes; TypeScript/build aprovados.
- [x] Seis cenários automatizados no Edge contra o build local passaram, sem erros JavaScript.

## Risco e reversão
Arquivos antigos que só funcionavam por conversão de tipos ou descarte silencioso agora são rejeitados com mensagem. O arquivo original não é alterado. A validação de importação é separada da leitura/migração de rascunhos para evitar regressão na recuperação já publicada.
Reverter a alteração de código restaura o comportamento permissivo anterior; documentos e chaves de armazenamento não mudam. A publicação e a eventual reversão devem ser acompanhadas no workflow Pages.
