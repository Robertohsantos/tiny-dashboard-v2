# Known Issues & Fixes

## Purchase Requirement Modal Freezes Screen After Close

**Status:** Resolved (2025-09-28)

### Symptoms
- Após gerar a lista de compras e fechar o modal (clicando fora, Cancelar ou Esc), toda a UI fica sem resposta.
- document.elementFromPoint() retorna <html> e o <body> aparece com style="pointer-events: none" no DevTools.
- Nenhuma camada data-radix-dismissable-layer permanece montada, mas os cliques não funcionam.

### Root Cause
O Floating UI, usado pelos Selects dentro de PurchaseListView, aplica document.body.style.pointerEvents = "none" durante a abertura do menu. Em algumas transições o estilo não era restaurado, deixando o corpo da página sem responder a eventos de ponteiro depois que o modal era fechado.

### Fix
- Resetar document.body.style.pointerEvents no efeito de fechamento do PurchaseRequirementModal (src/modules/produtos/components/shared/modals/purchase-requirement-modal.tsx).
- Confinar os portais dos Selects ao container do modal para evitar vazamentos (src/components/ui/select.tsx, src/modules/produtos/components/shared/modals/purchase-list-view.tsx).

### Verification Checklist
1. Gerar lista de compras, interagir com os filtros e fechar o modal por fora, Esc e botão Cancelar.
2. No console, confirmar que document.body.style.pointerEvents volta a ficar vazio após o fechamento.
3. Verificar se não restam overlays com data-radix-dismissable-layer no DOM.

### References
- PR/Commit: _(pending)_
- Files: src/modules/produtos/components/shared/modals/purchase-requirement-modal.tsx, src/components/ui/select.tsx, src/modules/produtos/components/shared/modals/purchase-list-view.tsx

