import { useState, useEffect, useCallback } from "react";
import { Loader2, ScrollText, AlertCircle, BarChart3 } from "lucide-react";
import {
    getUserSubmissionsBreakdown,
    type FormSubmissionItem,
} from "../../services/user.service";
import { cn } from "../../lib/utils";

interface SubmissionsPopoverProps {
    userId: string;
    className?: string;
}

export const SubmissionsPopover = ({
    userId,
    className,
}: SubmissionsPopoverProps) => {
    const [submissions, setSubmissions] = useState<FormSubmissionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await getUserSubmissionsBreakdown(userId);
            setSubmissions(data.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    // Loading State
    if (loading) {
        return (
            <div className={cn(
                "w-72 p-8 flex flex-col items-center justify-center gap-3 rounded-xl",
                "bg-popover text-popover-foreground shadow-xl border border-border/50 backdrop-blur-xl",
                className
            )}>
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                <p className="text-xs font-medium text-muted-foreground/80">Loading statistics...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className={cn(
                "w-72 p-6 flex flex-col items-center justify-center gap-2 rounded-xl text-center",
                "bg-popover text-popover-foreground shadow-xl border border-destructive/20",
                className
            )}>
                <AlertCircle className="h-8 w-8 text-destructive/50 mb-1" />
                <p className="text-sm font-semibold">Failed to load</p>
                <p className="text-xs text-muted-foreground">Could not fetch submission data.</p>
            </div>
        );
    }

    // Empty State
    if (submissions.length === 0) {
        return (
            <div className={cn(
                "w-72 p-8 flex flex-col items-center justify-center gap-3 rounded-xl text-center",
                "bg-popover text-popover-foreground shadow-xl border border-border/50 backdrop-blur-xl",
                className
            )}>
                <div className="p-3 rounded-full bg-muted/50 mb-1">
                    <ScrollText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-semibold">No Submissions</p>
                    <p className="text-xs text-muted-foreground mt-1 text-balance">
                        This user hasn't submitted any forms yet.
                    </p>
                </div>
            </div>
        );
    }

    const totalCount = submissions.reduce((acc, item) => acc + item.count, 0);

    return (
        <div
            className={cn(
                "w-80 rounded-xl overflow-hidden flex flex-col",
                "bg-popover text-popover-foreground",
                "shadow-2xl shadow-black/20",
                "border border-border/40",
                "animate-in fade-in zoom-in-95 duration-200",
                className
            )}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/40 bg-muted/20 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BarChart3 className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                </div>
                <div className="relative z-10">
                    <h4 className="text-sm font-semibold tracking-tight">
                        Submission Breakdown
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{totalCount}</span> total submissions
                        <span className="w-0.5 h-3 bg-border rounded-full" />
                        <span className="font-medium text-foreground">{submissions.length}</span> active forms
                    </p>
                </div>
            </div>

            {/* List Content */}
            <div className="max-h-[280px] overflow-y-auto py-2 scroll-smooth">
                {submissions.map((item, index) => (
                    <div key={item.formId} className="px-2">
                        <div className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/60 transition-all duration-200 cursor-default">
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Visual Indicator for ranking/order */}
                                <div className={cn(
                                    "w-1 h-8 rounded-full bg-muted transition-colors duration-300",
                                    index === 0 ? "bg-primary" :
                                        index === 1 ? "bg-primary/70" :
                                            index === 2 ? "bg-primary/40" : "group-hover:bg-primary/30"

                                )} />

                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                        {item.formTitle}
                                    </span>
                                    {index < 3 && (
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                            {index === 0 ? "Top Form" : index === 1 ? "2nd Most Used" : "3rd Most Used"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="pl-3">
                                <span className={cn(
                                    "flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-md text-xs font-bold transition-all shadow-sm border",
                                    index === 0 ? "bg-primary text-primary-foreground border-primary" :
                                        "bg-card text-foreground border-border group-hover:border-primary/30 group-hover:shadow-md"
                                )}>
                                    {item.count}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* subtle footer gradient overlay if list is long (optional visual cue) */}
            <div className="h-4 bg-gradient-to-t from-popover to-transparent pointer-events-none -mt-4 relative z-10" />
        </div>
    );
};
