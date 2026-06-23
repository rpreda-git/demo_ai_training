import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BoardDetailDTO, CardDetailDTO, CardDTO } from "@shared/types";
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

  return { addComment, deleteComment, toggleLabel };
}
