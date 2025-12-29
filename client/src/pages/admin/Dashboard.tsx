import { useEffect, useState, useCallback } from "react";
import { useDebouncedEffect } from "../../hooks/useDebounce";
import { Link, useNavigate } from "react-router-dom";
import {
  getForms,
  deleteForm,
  updateForm,
  getFormStats,
  type FormStats,
} from "../../services/form.service";
import {
  getAdminAnalytics,
  type AdminAnalytics,
} from "../../services/user.service";
import { type IForm, FormStatus, UserRole } from "@poc-admin-form/shared";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import { SearchFilterBar } from "../../components/search-filter/SearchFilterBar";
import { ViewToggle } from "../../components/ui/ViewToggle";
import { Pagination } from "../../components/ui/Pagination";
import { ViewType } from "@poc-admin-form/shared";
import { Stats } from "../../components/stats/Stats";
import { DefaultPopover } from "../../components/stats/DefaultPopover";
import { formatDateIST } from "../../utils/helper.utils";
import type { DateRange } from "../../utils/dateRange.utils";
import {
  ClipboardList,
  FileText,
  BarChart3,
  Eye,
  Globe,
  Copy,
  Trash2,
  Plus,
  RotateCcw,
  FileQuestion,
  CheckCircle,
  Clock,
  UserCog,
  Pencil,
  Users,
  FileClock,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<IForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Pagination & View State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewType, setViewType] = useState<ViewType>(() => {
    return (
      (localStorage.getItem(
        import.meta.env.VITE_VIEW_PREFERENCE_KEY
      ) as ViewType) || ViewType.LIST
    );
  });

  // Stats State
  const [stats, setStats] = useState<FormStats>({
    totalForms: 0,
    publishedForms: 0,
    totalResponses: 0,
    startDate: undefined,
    endDate: undefined,
  });
  const [statsRange, setStatsRange] = useState<DateRange>({});

  // Admin Analytics State
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics>({
    activeUsersCount: 0,
    draftFormsCount: 0,
    peakActivityHours: "N/A",
    heartbeatWindowHours: 1,
  });

  const toggleView = (type: ViewType) => {
    setViewType(type);
    localStorage.setItem(import.meta.env.VITE_VIEW_PREFERENCE_KEY, type);
  };

  const { addToast } = useToast();
  const { user } = useAuth();

  // Check if user has forms module permission (SUPERADMIN bypasses)
  const hasFormsPermission =
    user?.role === UserRole.SUPERADMIN ||
    user?.modulePermissions?.forms === true;

  const loadForms = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const response = await getForms(page, 6, search);
        setForms(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
      } catch {
        addToast("Failed to load forms", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  const loadStats = useCallback(
    async (range?: DateRange) => {
      try {
        const data = await getFormStats(range);
        setStats(data);
      } catch {
        addToast("Failed to load stats", "error");
      }
    },
    [addToast]
  );

  const loadAdminAnalytics = useCallback(async () => {
    try {
      const data = await getAdminAnalytics();
      setAdminAnalytics(data);
    } catch {
      addToast("Failed to load admin analytics", "error");
    }
  }, [addToast]);

  // Debounced search effect - triggers on search or page change
  useDebouncedEffect(
    () => {
      loadForms(currentPage, searchQuery);
    },
    [currentPage, searchQuery, loadForms],
    (deps) => (deps[1] ? 300 : 0) // Only debounce when searching (searchQuery is deps[1])
  );

  useEffect(() => {
    loadStats();
    loadAdminAnalytics();
  }, [loadStats, loadAdminAnalytics]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(id);
    try {
      await deleteForm(id);
      addToast("Form deleted successfully", "success");
      loadForms(currentPage, searchQuery);
    } catch {
      addToast("Failed to delete form", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublish = async (form: IForm) => {
    const newStatus =
      form.status === FormStatus.PUBLISHED
        ? FormStatus.UNPUBLISHED
        : FormStatus.PUBLISHED;
    const action =
      newStatus === FormStatus.PUBLISHED ? "published" : "unpublished";

    setActionLoading(form._id!);
    try {
      await updateForm(form._id!, { status: newStatus });
      addToast(`Form ${action} successfully`, "success");
      loadForms(currentPage, searchQuery);
    } catch {
      addToast("Failed to update form status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const copyFormLink = (formURL: string | undefined) => {
    if (!formURL) {
      addToast("No link available to copy", "error");
      return;
    }
    navigator.clipboard.writeText(formURL);
    addToast("Link copied to clipboard!", "success");
  };

  const copyServiceEmail = () => {
    const email = import.meta.env.VITE_SERVICE_ACCOUNT_EMAIL;
    if (email) {
      navigator.clipboard.writeText(email);
      addToast("Service account email copied!", "success");
    } else {
      addToast("Service account email not configured", "error");
    }
  };

  // Filter forms based on status filter (client-side for status)
  const filteredForms = forms.filter((form) => {
    return filterStatus === "ALL" || form.status === filterStatus;
  });

  if (loading && forms.length === 0) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-full space-y-8 animate-in fade-in duration-500">
      {/* Analytics Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Unified overview of forms and user activity
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasFormsPermission && (
            <Button
              variant="outline"
              className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50"
              onClick={copyServiceEmail}
              title="Copy Service Account Email"
            >
              <UserCog className="h-5 w-5 text-primary" />
              <span className="hidden sm:inline">Copy Service Email</span>
            </Button>
          )}
        </div>
      </div>
      {/* Unified Analytics Dashboard - Responsive 6-column grid */}
      <Stats
        dateRange={statsRange}
        stats={[
          {
            icon: <FileText className="h-6 w-6 text-primary" />,
            title: "Total Forms",
            value: stats.totalForms,
            hoverContent: (
              <DefaultPopover text="Total number of forms created in the selected time range." />
            ),
          },
          {
            icon: <Globe className="h-6 w-6 text-green-500" />,
            title: "Published Forms",
            value: stats.publishedForms,
            hoverContent: (
              <DefaultPopover text="Number of forms that are currently published within the selected time range." />
            ),
          },
          {
            icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
            title: "Total Responses",
            value: stats.totalResponses,
            hoverContent: (
              <DefaultPopover text="Total responses received across your forms in the selected time range." />
            ),
          },
          {
            icon: <Users className="h-6 w-6 text-emerald-500" />,
            title: "Currently Active Users",
            value: adminAnalytics.activeUsersCount,
            hoverContent: (
              <DefaultPopover
                text={`Users who have checked in within the last ${adminAnalytics.heartbeatWindowHours} hour(s).`}
              />
            ),
          },
          {
            icon: <FileClock className="h-6 w-6 text-orange-500" />,
            title: "Draft Forms",
            value: adminAnalytics.draftFormsCount,
            hoverContent: (
              <DefaultPopover text="Number of forms saved as draft (not published)." />
            ),
          },
          {
            icon: <TrendingUp className="h-6 w-6 text-rose-500" />,
            title: "Peak Activity Hours",
            value: adminAnalytics.peakActivityHours,
            hoverContent: (
              <DefaultPopover text="Busiest time range based on recent user activity (shown in IST)." />
            ),
          },
        ]}
        showTimePresets={true}
        showDateRange={true}
        onDateRangeChange={(range) => {
          setStatsRange(range);
          loadStats(range);
        }}
      />
      {/* Form Headers */}
      <div className="flex flex-col mt-6 md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            My Forms
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Create and manage your data collection forms
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ViewToggle viewType={viewType} onToggle={toggleView} />

          {hasFormsPermission && (
            <Link to="/admin/create">
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all gap-2"
              >
                <Plus className="h-5 w-5" />
                Create New Form
              </Button>
            </Link>
          )}
        </div>
      </div>
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between gap-4 p-1">
        <div className="flex-1">
          <SearchFilterBar
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            showFilter={true}
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
            filterOptions={[
              { label: "All Status", value: "ALL" },
              { label: "Published", value: FormStatus.PUBLISHED },
              { label: "Draft", value: FormStatus.UNPUBLISHED },
            ]}
            searchPlaceholder="Search forms by title or description..."
          />
        </div>
      </div>
      {/* Forms List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <PageLoader />
        </div>
      ) : forms.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {hasFormsPermission
                ? "Create your first form to start collecting responses from your users."
                : "No forms are available at the moment."}
            </p>
            {hasFormsPermission && (
              <Link to="/admin/create">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Form
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : filteredForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <div className="bg-muted p-3 rounded-full mb-3">
            <FileQuestion className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            No forms found matching your search.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("ALL");
            }}
            className="gap-2 mt-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </Button>
        </div>
      ) : viewType === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card
              key={form._id}
              className="group hover:shadow-xl transition-all duration-300 border border-border/40 hover:border-primary/40 bg-card hover:bg-card/80"
            >
              {hasFormsPermission ? (
                <Link to={`/admin/edit/${form._id}`} className="block">
                  <CardHeader className="pb-3 cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/5 rounded-md mt-1 group-hover:bg-primary/10 transition-colors">
                          <FileText className="h-4 w-4 text-primary/80" />
                        </div>
                        <div>
                          <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {form.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 min-h-10 mt-1">
                            {form.description || "No description provided."}
                          </CardDescription>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${
                          form.status === FormStatus.PUBLISHED
                            ? "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900"
                        }`}
                      >
                        {form.status === FormStatus.PUBLISHED ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {form.status.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                </Link>
              ) : (
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/5 rounded-md mt-1 group-hover:bg-primary/10 transition-colors">
                        <FileText className="h-4 w-4 text-primary/80" />
                      </div>
                      <div>
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {form.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 min-h-10 mt-1">
                          {form.description || "No description provided."}
                        </CardDescription>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${
                        form.status === FormStatus.PUBLISHED
                          ? "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900"
                          : "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900"
                      }`}
                    >
                      {form.status === FormStatus.PUBLISHED ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {form.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
              )}
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 p-3 rounded-lg border border-border/30">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1">
                      <FileQuestion className="h-3 w-3" />
                      Questions
                    </p>
                    <p className="font-bold text-lg">
                      {form.questions?.length || 0}
                    </p>
                  </div>
                  <div className="text-center border-l border-border/30">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Responses
                    </p>
                    <p className="font-bold text-lg">
                      {form.responseCount || 0}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Created{" "}
                  {formatDateIST(form.createdAt!, { dateStyle: "medium" })}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 pt-3 border-t border-border/40 bg-muted/5">
                {hasFormsPermission ? (
                  <>
                    <Link to={`/admin/edit/${form._id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1"
                      >
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(form)}
                      disabled={actionLoading === form._id}
                      className={
                        form.status === FormStatus.PUBLISHED
                          ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      }
                      title={
                        form.status === FormStatus.PUBLISHED
                          ? "Unpublish Form"
                          : "Publish Form"
                      }
                    >
                      {form.status === FormStatus.PUBLISHED ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </Button>
                    {form.status === FormStatus.PUBLISHED && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFormLink(form.googleSheetUrl)}
                        title="Copy Google Sheet Link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(form._id!)}
                      disabled={actionLoading === form._id}
                      title="Delete Form"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    View only
                  </span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredForms.map((form) => (
                  <tr
                    key={form._id}
                    onClick={() => {
                      if (!hasFormsPermission) return;
                      navigate(`/admin/edit/${form._id}`);
                    }}
                    className={`group hover:bg-muted/30 transition-colors ${
                      hasFormsPermission ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-md group-hover:bg-primary/10 transition-colors">
                          <FileText className="h-4 w-4 text-primary/80" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {form.title}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-50">
                            {form.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border items-center gap-1 ${
                          form.status === FormStatus.PUBLISHED
                            ? "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900"
                        }`}
                      >
                        {form.status === FormStatus.PUBLISHED ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                        {form.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-6 text-sm">
                        <div
                          className="flex items-center gap-1.5"
                          title="Questions"
                        >
                          <FileQuestion className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold">
                            {form.questions?.length || 0}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          title="Responses"
                        >
                          <CheckCircle className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold">
                            {form.responseCount || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                      {formatDateIST(form.createdAt!, { dateStyle: "medium" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasFormsPermission ? (
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/admin/edit/${form._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublish(form)}
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === form._id}
                            title={
                              form.status === FormStatus.PUBLISHED
                                ? "Unpublish Form"
                                : "Publish Form"
                            }
                          >
                            {form.status === FormStatus.PUBLISHED ? (
                              <Eye className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Globe className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          {form.status === FormStatus.PUBLISHED && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyFormLink(form.googleSheetUrl)}
                              className="h-8 w-8 p-0"
                              title="Copy Google Sheet Link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(form._id!)}
                            disabled={actionLoading === form._id}
                            title="Delete Form"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
        totalItems={totalItems}
        itemsPerPage={3}
      />
    </div>
  );
};
