import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BoardDetailDTO, CardDTO } from "@shared/types";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import * as cache from "@/lib/board-cache";

const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

export function boardQueryOptions(boardId: string) {
  return queryOptions({
    queryKey: queryKeys.board(boardId),
    queryFn: () => api.getBoard(boardId),
  });
}

export function useBoard(boardId: string) {
  return useQuery(boardQueryOptions(boardId));
}

/**
 * All board-detail mutations, each updating the cached `BoardDetailDTO`.
 * Edits/moves/deletes are optimistic; creates apply the server response so
 * generated ids are correct.
 */
export function useBoardActions(boardId: string) {
  const qc = useQueryClient();
  const key = queryKeys.board(boardId);

  const write = (updater: (board: BoardDetailDTO) => BoardDetailDTO) => {
    const current = qc.getQueryData<BoardDetailDTO>(key);
    if (current) qc.setQueryData(key, updater(current));
  };

  // Optimistic edit/delete: snapshot → apply → rollback on error → invalidate.
  function optimistic<V>(
    mutationFn: (vars: V) => Promise<unknown>,
    apply: (board: BoardDetailDTO, vars: V) => BoardDetailDTO,
  ) {
    return useMutation({
      mutationFn,
      onMutate: async (vars: V) => {
        await qc.cancelQueries({ queryKey: key });
        const previous = qc.getQueryData<BoardDetailDTO>(key);
        if (previous) qc.setQueryData(key, apply(previous, vars));
        return { previous };
      },
      onError: (e, _vars, ctx) => {
        if (ctx?.previous) qc.setQueryData(key, ctx.previous);
        toast.error(message(e));
      },
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    });
  }

  const createColumn = useMutation({
    mutationFn: (title: string) => api.createColumn(boardId, title),
    onSuccess: (column) => write((b) => cache.addColumn(b, column)),
    onError: (e) => toast.error(message(e)),
  });

  const renameColumn = optimistic(
    (vars: { columnId: string; title: string }) => api.updateColumn(vars.columnId, { title: vars.title }),
    (b, vars) => cache.patchColumn(b, vars.columnId, { title: vars.title }),
  );

  const deleteColumn = optimistic(
    (columnId: string) => api.deleteColumn(columnId),
    (b, columnId) => cache.removeColumn(b, columnId),
  );

  const createCard = useMutation({
    mutationFn: (vars: { columnId: string; title: string }) =>
      api.createCard(vars.columnId, vars.title),
    onSuccess: (card) => write((b) => cache.addCard(b, card.columnId, card)),
    onError: (e) => toast.error(message(e)),
  });

  const updateCard = optimistic(
    (vars: { cardId: string; data: Parameters<typeof api.updateCard>[1] }) =>
      api.updateCard(vars.cardId, vars.data),
    (b, vars) => {
      const patch: Partial<CardDTO> = {};
      if (vars.data.title !== undefined) patch.title = vars.data.title;
      if (vars.data.description !== undefined) patch.description = vars.data.description;
      if (vars.data.dueDate !== undefined) patch.dueDate = vars.data.dueDate;
      if (vars.data.completed !== undefined) patch.completed = vars.data.completed;
      if (vars.data.columnId !== undefined) patch.columnId = vars.data.columnId;
      if (vars.data.position !== undefined) patch.position = vars.data.position;
      return cache.patchCard(b, vars.cardId, patch);
    },
  );

  const deleteCard = optimistic(
    (cardId: string) => api.deleteCard(cardId),
    (b, cardId) => cache.removeCard(b, cardId),
  );

  const createLabel = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.createLabel(boardId, data),
    onSuccess: (label) =>
      write((b) => ({ ...b, labels: [...b.labels, label] })),
    onError: (e) => toast.error(message(e)),
  });

  const addMember = useMutation({
    mutationFn: (email: string) => api.addMember(boardId, email),
    onSuccess: (member) => {
      write((b) => cache.addMember(b, member));
      toast.success(`Added ${member.name}`);
    },
    onError: (e) => toast.error(message(e)),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.removeMember(boardId, userId),
    onSuccess: (_res, userId) => write((b) => cache.removeMember(b, userId)),
    onError: (e) => toast.error(message(e)),
  });

  return {
    createColumn,
    renameColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    createLabel,
    addMember,
    removeMember,
    /** Directly write to the board cache (used for live drag-and-drop). */
    write,
  };
}
