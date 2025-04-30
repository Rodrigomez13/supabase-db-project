import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityProps {
  id: string;
  user: string;
  action: string;
  target: string;
  server?: string;
  time: string;
}

interface ActivityFeedProps {
  activities: ActivityProps[];
  loading?: boolean;
}

export function ActivityFeed({
  activities,
  loading = false,
}: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-usina-text-secondary">
        No hay actividades recientes.
      </p>
    );
  }

  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-usina-primary/20 p-1 flex-shrink-0">
            <Bell className="h-4 w-4 text-usina-primary" />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-usina-text-primary break-words">
              <span className="font-medium">{activity.user}</span>{" "}
              {activity.action}{" "}
              <span className="font-medium">{activity.target}</span>
              {activity.server && (
                <>
                  {" "}
                  en <span className="font-medium">{activity.server}</span>
                </>
              )}
            </p>
            <p className="text-xs text-usina-text-secondary">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
