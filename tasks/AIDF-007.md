# AIDF-007 — enquadramento seguro de imagens

Pedido autorizado: tamanho e posição de fotos, cabeçalhos e rodapés com testes e deploy. Controles no painel: tamanho 25–300%, posição horizontal/vertical -50 a 50%, restaurar enquadramento. Transformação somente da imagem dentro do contêiner com overflow hidden; blocos, etiquetas e paginação mantêm geometria. Metadados opcionais photoAdjustment/imageAdjustment são validados na importação e preservados em drafts/JSON/histórico. Padrão sem metadados mantém imagem centralizada. Ícone de importação central e borda cinza tracejada suave substituem texto no espaço de foto.

Aceitação: transformações persistem e podem ser desfeitas/restauradas; limites e valores não finitos rejeitados; tamanhos físicos preservados. Reordenação continua pelas alças e Subir/Descer existentes. Seletor de logos não faz parte desta entrega de enquadramento e exige biblioteca de logos fornecida/definida.

Reversão: revert do commit com deploy, exportando projetos antes; versões anteriores descartam os novos campos. Sem exclusão de rascunhos.
