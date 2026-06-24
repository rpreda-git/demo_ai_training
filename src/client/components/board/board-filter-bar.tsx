import { Check, Filter, Search, X } from "lucide-react";
import type { LabelDTO, MemberDTO, Priority } from "@shared/types";
import { PRIORITY_META } from "@shared/types";
import { cn } from "@/lib/utils";
import { hasActiveFilters, type BoardFilters, type DueFilter } from "@/lib/card-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DUE_LABELS: Record<DueFilter, string> = {
  overdue: "Overdue",
  today: "Due today",
  week: "Due this week",
};

export function BoardFilterBar({
  filters,
  labels,
  members,
  onChange,
  onClear,
}: {
  filters: BoardFilters;
  labels: LabelDTO[];
  members: MemberDTO[];
  onChange: (patch: Partial<BoardFilters>) => void;
  onClear: () => void;
}) {
  const active = hasActiveFilters(filters);
  const selectedLabel = labels.find((l) => l.id === filters.label);
  const selectedMember = members.find((m) => m.userId === filters.assignee);
  const assigneeLabel =
    filters.assignee === "me" ? "Me" : selectedMember ? selectedMember.name : "Anyone";

  const triggerCls = (on: boolean) =>
    cn("h-8", on && "border-primary text-primary");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={filters.q ?? ""}
          onChange={(e) => onChange({ q: e.target.value || undefined })}
          placeholder="Search cards…"
          className="h-8 w-44 pl-8"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={triggerCls(!!filters.label)}>
            {selectedLabel ? selectedLabel.name : "Label"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onChange({ label: undefined })}>
            All labels
          </DropdownMenuItem>
          {labels.map((l) => (
            <DropdownMenuItem key={l.id} onSelect={() => onChange({ label: l.id })}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              {l.name}
              {filters.label === l.id && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={triggerCls(!!filters.due)}>
            {filters.due ? DUE_LABELS[filters.due] : "Due"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onChange({ due: undefined })}>Any time</DropdownMenuItem>
          {(Object.keys(DUE_LABELS) as DueFilter[]).map((key) => (
            <DropdownMenuItem key={key} onSelect={() => onChange({ due: key })}>
              {DUE_LABELS[key]}
              {filters.due === key && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={triggerCls(!!filters.assignee)}>
            {assigneeLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onChange({ assignee: undefined })}>
            Anyone
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onChange({ assignee: "me" })}>
            Me
            {filters.assignee === "me" && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
          {members.map((m) => (
            <DropdownMenuItem key={m.userId} onSelect={() => onChange({ assignee: m.userId })}>
              {m.name}
              {filters.assignee === m.userId && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={triggerCls(!!filters.priority)}>
            {filters.priority && filters.priority !== "none"
              ? PRIORITY_META[filters.priority].label
              : "Priority"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onChange({ priority: undefined })}>
            Any priority
          </DropdownMenuItem>
          {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
            <DropdownMenuItem key={p} onSelect={() => onChange({ priority: p })}>
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: PRIORITY_META[p as Exclude<Priority, "none">].color }}
              />
              {PRIORITY_META[p as Exclude<Priority, "none">].label}
              {filters.priority === p && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {active ? (
        <Button variant="ghost" size="sm" className="h-8" onClick={onClear}>
          <X className="size-4" /> Clear
        </Button>
      ) : (
        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
          <Filter className="size-3.5" /> Filter
        </span>
      )}
    </div>
  );
}
