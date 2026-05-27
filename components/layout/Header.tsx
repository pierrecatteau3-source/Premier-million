import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  description?: string;
}

export async function Header({ title, description }: HeaderProps) {
  const session = await getServerSession(authOptions);
  const initials = session?.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "PM";

  return (
    <header className="flex items-center justify-between bg-background px-6 pt-8 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-none">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-normal">
          MVP
        </Badge>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
