import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BoardDetailDTO, CardDetailDTO, CardDTO, ChecklistItemDTO } from "@shared/types";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import * as cache from "@/lib/board-cache";

const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

export function useCard(cardId: string | null) {
  return useQuery({
    queryKey: queryKeys.card(cardId ?? "none"),
    queryFn: () => api.getCard(cardId as string),
    enabled: !!cardId,
  });
}

export function useCardActions(boardId: string, cardId: string) {
  const qc = useQueryClient();
  const cardKey = queryKeys.card(cardId);
  const boardKey = queryKeys.board(boardId);

  const patchCardDetail = (updater: (card: CardDetailDTO) => CardDetailDTO) => {
    const current = qc.getQueryData<CardDetailDTO>(cardKey);
    if (current) qc.setQueryData(cardKey, updater(current));
  };
  const patchBoardCard = (cardPatch: Partial<CardDTO>) => {
    const board = qc.getQueryData<BoardDetailDTO>(boardKey);
    if (board) qc.setQueryData(boardKey, cache.patchCard(board, cardId, cardPatch));
  };

  const addComment = useMutation({
    mutationFn: (body: string) => api.addComment(cardId, body),
    onSuccess: (comment) => {
      let count = 0;
      patchCardDetail((card) => {
        const comments = [...card.comments, comment];
        count = comments.length;
        return { ...card, comments, commentCount: comments.length };
      });
      patchBoardCard({ commentCount: count });
    },
    onError: (e) => toast.error(message(e)),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => api.deleteComment(commentId),
    onSuccess: (_res, commentId) => {
      let count = 0;
      patchCardDetail((card) => {
        const comments = card.comments.filter((c) => c.id !== commentId);
        count = comments.length;
        return { ...card, comments, commentCount: comments.length };
      });
      patchBoardCard({ commentCount: count });
    },
    onError: (e) => toast.error(message(e)),
  });

  const toggleLabel = useMutation({
    mutationFn: (vars: { labelId: string; attached: boolean }) =>
      vars.attached
        ? api.removeCardLabel(cardId, vars.labelId)
        : api.addCardLabel(cardId, vars.labelId),
    onSuccess: (card) => {
      patchCardDetail((detail) => ({ ...detail, labels: card.labels }));
      patchBoardCard({ labels: card.labels });
    },
    onError: (e) => toast.error(message(e)),
  });

  const setAssignee = useMutation({
    mutationFn: (assigneeId: string | null) => api.updateCard(cardId, { assigneeId }),
    onSuccess: (card) => {
      patchCardDetail((detail) => ({ ...detail, assignee: card.assignee }));
      patchBoardCard({ assignee: card.assignee });
    },
    onError: (e) => toast.error(message(e)),
  });

  // After the checklist changes, mirror the totals onto the board card.
  const syncChecklist = (checklist: ChecklistItemDTO[]) =>
    patchBoardCard({
      checklistTotal: checklist.length,
      checklistDone: checklist.filter((i) => i.completed).length,
    });

  const addChecklistItem = useMutation({
    mutationFn: (text: string) => api.addChecklistItem(cardId, text),
    onSuccess: (item) => {
      let next: ChecklistItemDTO[] = [];
      patchCardDetail((d) => {
        next = [...d.checklist, item];
        return { ...d, checklist: next };
      });
      syncChecklist(next);
    },
    onError: (e) => toast.error(message(e)),
  });

  const toggleChecklistItem = useMutation({
    mutationFn: (vars: { itemId: string; completed: boolean }) =>
      api.updateChecklistItem(vars.itemId, { completed: vars.completed }),
    onSuccess: (item) => {
      let next: ChecklistItemDTO[] = [];
      patchCardDetail((d) => {
        next = d.checklist.map((i) => (i.id === item.id ? item : i));
        return { ...d, checklist: next };
      });
      syncChecklist(next);
    },
    onError: (e) => toast.error(message(e)),
  });

  const deleteChecklistItem = useMutation({
    mutationFn: (itemId: string) => api.deleteChecklistItem(itemId),
    onSuccess: (_res, itemId) => {
      let next: ChecklistItemDTO[] = [];
      patchCardDetail((d) => {
        next = d.checklist.filter((i) => i.id !== itemId);
        return { ...d, checklist: next };
      });
      syncChecklist(next);
    },
    onError: (e) => toast.error(message(e)),
  });

  return {
    addComment,
    deleteComment,
    toggleLabel,
    setAssignee,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
  };
}
