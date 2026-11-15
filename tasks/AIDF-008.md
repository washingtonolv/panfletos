# AIDF-008 — seletor de logos

Pedido: biblioteca de logos em pasta, seleção no produto e exibição no panfleto. Origem da pasta solicitada ao usuário; nenhuma arte de marca inventada. Pasta padrão src/assets/brand-logos; Vite enumera imagens na compilação. Projetos guardam filename estável, com validação sem caminhos/URLs. Logos ausentes exibem marca textual e aviso na edição; seleção é opcional, removível, desfazível e preservada no JSON/drafts/cópias. Imagem cabe na linha da marca sem alterar geometria.

Aceitação: selecionar/visualizar/remover, busca, estado vazio, arquivo ausente, undo/redo, JSON/reload, impressão, segurança de identificador e regressões. Arquivos só entram na biblioteca após build/deploy. Risco: renomear/remover arquivo deixa projetos com fallback textual. Reversão: revert e deploy, exportando projetos antes; versões anteriores descartam brandLogo.

Origem confirmada: C:\Users\washi\Downloads\1. LOGOS\1. LOGOS. Incluídos 58 arquivos de logos atuais/variações, sem acervo antigo, fontes, vídeos, fotos de produtos ou documentos. Evidências: 33 testes de modelo, build/TypeScript e lint sem erros; suíte Edge e screenshot desktop. Deploy continua o fluxo autorizado do editor; resultado será reportado no fechamento.
