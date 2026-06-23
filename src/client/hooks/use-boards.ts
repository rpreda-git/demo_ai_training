import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BoardSummaryDTO } from "@shared/types";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

export function useBoards() {
  return useQuery({ queryKey: queryKeys.boards, queryFn: api.listBoards });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBoard,
    onSuccess: (board) => {
      qc.setQueryData<BoardSummaryDTO[]>(queryKeys.boards, (old) => [board, ...(old ?? [])]);
      toast.success(`Created “${board.title}”`);
    },
    onError: (e) => toast.error(message(e)),
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      boardId: string;
      data: { title?: string; description?: string | null; color?: string };
    }) => api.updateBoard(vars.boardId, vars.data),
    onSuccess: (board) => {
      qc.setQueryData<BoardSummaryDTO[]>(queryKeys.boards, (old) =>
        (old ?? []).map((b) => (b.id === board.id ? board : b)),
      );
      qc.invalidateQueries({ queryKey: queryKeys.board(board.id) });
    },
    onError: (e) => toast.error(message(e)),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => api.deleteBoard(boardId),
    onMutate: async (boardId) => {
      await qc.cancelQueries({ queryKey: queryKeys.boards });
      const previous = qc.getQueryData<BoardSummaryDTO[]>(queryKeys.boards);
      qc.setQueryData<BoardSummaryDTO[]>(queryKeys.boards, (old) =>
        (old ?? []).filter((b) => b.id !== boardId),
      );
      return { previous };
    },
    onError: (e, _boardId, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.boards, ctx.previous);
      toast.error(message(e));
    },
    onSuccess: () => toast.success("Board deleted"),
  });
}
