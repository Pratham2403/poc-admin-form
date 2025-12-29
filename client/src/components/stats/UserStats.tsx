import { useState, useEffect, useCallback } from "react";
import { useToast } from "../ui/Toast";
import { Spinner } from "../ui/Spinner";
import {
  getUserAnalytics,
  type UserAnalytics,
} from "../../services/user.service";
import { Stats, type TimeFilter } from "./Stats";
import { SubmissionsPopover } from "./SubmissionsPopover";
import { DefaultPopover } from "./DefaultPopover";
import { BarChart3, FileText, Activity } from "lucide-react";

export const UserStats = ({ id }: { id: string }) => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    responseCount: 0,
    formsRespondedTo: 0,
    totalSubmissions: 0,
    timeFilter: "all",
  });
  const { addToast } = useToast();

  const loadAnalytics = useCallback(
    async (
      timeFilter: "today" | "month" | "all" = "all",
      showLoading = false
    ) => {
      try {
        if (showLoading) setInitialLoading(true);
        const data = await getUserAnalytics(id, timeFilter);
        setAnalytics(data);
      } catch {
        addToast("Failed to load analytics", "error");
      } finally {
        if (showLoading) setInitialLoading(false);
      }
    },
    [addToast, id]
  );

  useEffect(() => {
    loadAnalytics("all", true);
  }, [loadAnalytics]);

  if (initialLoading) {
    return <Spinner />;
  }

  return (
    <>
      {/* Analytics Stats */}
      <Stats
        stats={[
          {
            icon: <Activity className="h-6 w-6 text-blue-500" />,
            title: "Activity Rate",
            value: analytics.responseCount,
            hoverContent: (
              <DefaultPopover
                text="Number of responses you submitted in the selected time range."
              />
            ),
          },
          {
            icon: <FileText className="h-6 w-6 text-green-500" />,
            title: "Forms Responded",
            value: analytics.formsRespondedTo,
            hoverContent: (
              <DefaultPopover
                text="Number of unique forms you responded to in the selected time range."
              />
            ),
          },
          {
            icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
            title: "Total Submissions",
            value: analytics.totalSubmissions,
            hoverContent: <SubmissionsPopover userId={id} />,
          },
        ]}
        onTimeFilterChange={(filter: TimeFilter) => {
          loadAnalytics(filter);
        }}
      />
    </>
  );
};
