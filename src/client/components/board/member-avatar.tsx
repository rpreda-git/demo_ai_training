import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function memberInitials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MemberAvatar({
  user,
  className,
}: {
  user: { name: string; image: string | null };
  className?: string;
}) {
  return (
    <Avatar className={cn("size-6", className)} title={user.name}>
      {user.image && <AvatarImage src={user.image} alt={user.name} />}
      <AvatarFallback className="text-[10px]">{memberInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
