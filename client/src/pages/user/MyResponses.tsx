import { useState, useCallback } from "react";
import { useDebouncedEffect } from "../../hooks/useDebounce";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Pencil, FileText, Clock, CheckCircle } from "lucide-react";
import {
  getMyRespondedForms,
  getMyResponses,
} from "../../services/response.service";
import { useToast } from "../../components/ui/Toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { usePortalPath } from "../../hooks/usePortalPath";
import { SearchFilterBar } from "../../components/search-filter/SearchFilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { type IForm, ViewType } from "@poc-admin-form/shared";
import { ViewToggle } from "../../components/ui/ViewToggle";
import type { DateRange } from "../../utils/dateRange.utils";
import {
  formatDateIST,
  formatDateTimeIST,
  formatTimeIST,
} from "../../utils/helper.utils";

// Individual response structure
interface ResponseItem {
  _id: string;
  form: Pick<IForm, "_id" | "title" | "allowEditResponse">;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const RESPONSES_PER_PAGE = 12;

export const MyResponses = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);

  // Pagination
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

  const toggleView = (type: ViewType) => {
    setViewType(type);
    localStorage.setItem(import.meta.env.VITE_VIEW_PREFERENCE_KEY, type);
  };

  const { addToast } = useToast();
  const { getPath } = usePortalPath();

  const loadResponses = useCallback(
    async (page = 1, range?: DateRange) => {
      try {
        setLoading(true);
        const response = await getMyResponses(page, RESPONSES_PER_PAGE, {
          range,
          formIds: selectedFormIds,
        });
        setResponses(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
      } catch {
        addToast("Failed to load responses", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast, selectedFormIds]
  );

  // Debounced fetch effect - triggers on filter or page change
  useDebouncedEffect(
    () => {
      loadResponses(currentPage, dateRange);
    },
    [currentPage, dateRange, selectedFormIds, loadResponses],
    300
  );

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const loadRespondedForms = useCallback(async () => {
    const response = await getMyRespondedForms();
    const rows = (response?.data ?? []) as Array<{
      formId: string;
      title: string;
    }>;
    return rows
      .filter((row) => row?.formId && row?.title)
      .map((row) => ({ id: String(row.formId), label: String(row.title) }));
  }, []);

  const handleSelectedFormIdsChange = (ids: string[]) => {
    setSelectedFormIds(ids);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading && responses.length === 0) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-full space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            My Responses
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your submissions across different forms.
          </p>
        </div>
        <div className="mt-4 md:mt-0 pr-4">
          <ViewToggle viewType={viewType} onToggle={toggleView} />
        </div>
      </div>
      {/* Time Filter */}
      <div className="w-full">
        <SearchFilterBar
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          showTimePresets={true}
          showDateRange={true}
          showCheckboxMultiSelect={true}
          checkboxMultiSelect={{
            selectedIds: selectedFormIds,
            onSelectedIdsChange: handleSelectedFormIdsChange,
            loadOptions: loadRespondedForms,
            triggerPlaceholder: "All forms",
            triggerAriaLabel: "Filter responses by form",
            searchPlaceholder: "Search responded forms...",
          }}
        />
      </div>
      {responses.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No responses found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {dateRange.startDate || dateRange.endDate
                ? "No responses found in the selected time range."
                : "You haven't submitted any forms yet."}
            </p>
            {!dateRange.startDate && !dateRange.endDate && (
              <Link to={getPath("/forms")}>
                <Button size="lg" className="gap-2">
                  Browse Available Forms
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      ) : viewType === ViewType.GRID ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {responses.map((response) => (
            <Link to={getPath(`/my-responses/${response._id}/view`)}>
              <Card
                key={response._id}
                className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle
                      className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors"
                      title={response.form?.title}
                    >
                      {response.form?.title || "Form"}
                    </CardTitle>

                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 max-w-40 sm:max-w-none truncate">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTimeIST(response.updatedAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/30 p-2 rounded flex flex-col items-center justify-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Answers
                      </span>
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {Object.keys(response.answers).length}
                      </span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded flex flex-col items-center justify-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Updated
                      </span>
                      <span className="font-semibold text-xs text-center">
                        {response.updatedAt !== response.createdAt
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border/30 bg-muted/5 flex gap-2">
                  {response.form?.allowEditResponse ? (
                    <Link
                      to={getPath(`/my-responses/${response._id}/edit`)}
                      className="flex-1"
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-2 shadow-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      to={getPath(`/my-responses/${response._id}/view`)}
                      className="flex-1"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </Link>
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
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Answers
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Edited
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {responses.map((response) => (
                  <tr
                    key={response._id}
                    className="group hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(getPath(`/my-responses/${response._id}/view`))}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded-md group-hover:bg-primary/10 transition-colors">
                          <FileText className="h-4 w-4 text-primary/80" />
                        </div>
                        <div
                          className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-50"
                          title={response.form?.title}
                        >
                          {response.form?.title || "Form"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-muted-foreground">
                        {formatDateIST(response.createdAt)}
                        <span className="block text-xs">
                          {formatTimeIST(response.createdAt, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">
                          {Object.keys(response.answers).length}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {response.updatedAt !== response.createdAt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {response.form?.allowEditResponse ? (
                        <Link
                          to={getPath(`/my-responses/${response._id}/edit`)}
                        >
                          <Button size="sm" className="h-8 shadow-md gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                      ) : (
                        <Link
                          to={getPath(`/my-responses/${response._id}/view`)}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
        totalItems={totalItems}
        itemsPerPage={RESPONSES_PER_PAGE}
      />
    </div>
  );
};
