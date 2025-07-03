import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "types";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityFeedProps {
  data: Activity[];
  isLoading: boolean;
}

function ActivityFeedItemSkeleton() {
    return (
        <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    );
}

export function ActivityFeed({ data, isLoading }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
            {isLoading ? (
                <div className="space-y-4">
                    <ActivityFeedItemSkeleton />
                    <ActivityFeedItemSkeleton />
                    <ActivityFeedItemSkeleton />
                    <ActivityFeedItemSkeleton />
                    <ActivityFeedItemSkeleton />
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                            <div>
                                <p className="text-sm font-medium">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}