import { useState, useCallback, useEffect } from "react";
import { useDebouncedEffect } from "../../hooks/useDebounce";
import { Link } from "react-router-dom";
import { Eye, Pencil, FileText, Clock, CheckCircle } from "lucide-react";
import {
  getMyResponses,
  getFormResponses,
} from "../../services/response.service";
import { useToast } from "../../components/ui/Toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { usePortalPath } from "../../hooks/usePortalPath";
import { SearchFilterBar } from "../../components/ui/SearchFilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { type IForm } from "@poc-admin-form/shared";

// Form group from getMyResponses (without responses array)
interface FormGroup {
  _id: string; // Form ID
  form: IForm;
  latestActivity: string;
  responseCount: number;
}

// Individual response structure
interface ResponseItem {
  _id: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Per-group pagination and responses state
interface GroupResponseState {
  responses: ResponseItem[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
}

const RESPONSES_PER_PAGE = 3;

export const MyResponses = () => {
  const [formGroups, setFormGroups] = useState<FormGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Top-level pagination for form groups
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Per-group responses state (keyed by formId)
  const [groupResponses, setGroupResponses] = useState<
    Record<string, GroupResponseState>
  >({});

  const { addToast } = useToast();
  const { getPath } = usePortalPath();

  // Load form groups (without responses)
  const loadFormGroups = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const response = await getMyResponses(page, 6, search);
        setFormGroups(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalItems(response.pagination.total);
        // Reset group responses when form groups change
        setGroupResponses({});
      } catch {
        addToast("Failed to load responses", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  // Load responses for a specific form group
  const loadGroupResponses = useCallback(
    async (formId: string, page = 1) => {
      // Set loading state for this group
      setGroupResponses((prev) => ({
        ...prev,
        [formId]: {
          ...prev[formId],
          loading: true,
          responses: prev[formId]?.responses || [],
          currentPage: prev[formId]?.currentPage || 1,
          totalPages: prev[formId]?.totalPages || 1,
        },
      }));

      try {
        const response = await getFormResponses(
          formId,
          page,
          RESPONSES_PER_PAGE
        );
        setGroupResponses((prev) => ({
          ...prev,
          [formId]: {
            responses: response.data,
            currentPage: response.pagination.page,
            totalPages: response.pagination.pages,
            loading: false,
          },
        }));
      } catch {
        addToast("Failed to load responses for form", "error");
        setGroupResponses((prev) => ({
          ...prev,
          [formId]: {
            ...prev[formId],
            loading: false,
          },
        }));
      }
    },
    [addToast]
  );

  // Debounced search effect - triggers on search or page change
  useDebouncedEffect(
    () => {
      loadFormGroups(currentPage, searchQuery);
    },
    [currentPage, searchQuery, loadFormGroups],
    300
  );

  // Load responses for each form group when groups change
  useEffect(() => {
    formGroups.forEach((group) => {
      // Only load if not already loaded
      if (!groupResponses[group._id]) {
        loadGroupResponses(group._id, 1);
      }
    });
  }, [formGroups, groupResponses, loadGroupResponses]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle per-group pagination
  const handleGroupPageChange = (formId: string, page: number) => {
    loadGroupResponses(formId, page);
  };

  if (loading && formGroups.length === 0) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-full space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            My Responses
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your submissions across different forms.
          </p>
        </div>
      </div>
      {/* Search Bar */}
      <div className="max-w-5xl">
        <SearchFilterBar
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by form title..."
        />
      </div>
      {formGroups.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No responses found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery
                ? "Try adjusting your search terms."
                : "You haven't submitted any forms yet."}
            </p>
            {!searchQuery && (
              <Link to={getPath("/forms")}>
                <Button size="lg" className="gap-2">
                  Browse Available Forms
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {formGroups.map((group) => {
            const groupState = groupResponses[group._id];
            const responses = groupState?.responses || [];
            const groupCurrentPage = groupState?.currentPage || 1;
            const groupTotalPages = groupState?.totalPages || 1;
            const groupLoading = groupState?.loading ?? true;

            return (
              <div key={group._id} className="space-y-4">
                {/* Group Header with inline pagination */}
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {group.form.title}
                      </h2>
                      <p className="text-sm text-muted-foreground hidden sm:block">
                        Last active:{" "}
                        {new Date(group.latestActivity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                      {group.responseCount} Response
                      {group.responseCount !== 1 ? "s" : ""}
                    </span>
                    {/* Compact inline pagination for responses within this group */}
                    <Pagination
                      currentPage={groupCurrentPage}
                      totalPages={groupTotalPages}
                      onPageChange={(page) =>
                        handleGroupPageChange(group._id, page)
                      }
                      disabled={groupLoading}
                      showPageInfo={false}
                      className="border-0 pt-0 mt-0 gap-1"
                    />
                  </div>
                </div>

                {/* Response Cards Grid */}
                {groupLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No responses found for this form.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {responses.map((response) => (
                      <Card
                        key={response._id}
                        className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-primary">
                              Submission
                            </CardDescription>
                          </div>
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(response.createdAt).toLocaleDateString()}
                            <span className="text-muted-foreground font-normal text-sm">
                              {new Date(response.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </CardTitle>
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
                          {group.form.allowEditResponse ? (
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
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Top-level Pagination Controls for Form Groups */}
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
