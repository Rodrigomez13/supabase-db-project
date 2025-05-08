import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border bg-background/5">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="w-2 h-2 mt-1 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{activity.user || "Sistema"}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {new Date(activity.timestamp).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            No hay actividad reciente para mostrar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
