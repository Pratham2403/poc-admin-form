import { useState, useCallback } from "react";
import { useDebouncedEffect } from "../../hooks/useDebounce";
import { Link, useNavigate } from "react-router-dom";
import { getForms } from "../../services/form.service";
import { type IForm, ViewType } from "@poc-admin-form/shared";
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
import { usePortalPath } from "../../hooks/usePortalPath";
import { SearchFilterBar } from "../../components/ui/SearchFilterBar";
import { ViewToggle } from "../../components/ui/ViewToggle";
import { Pagination } from "../../components/ui/Pagination";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export const FormsList = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<IForm[]>([]);
  const [loading, setLoading] = useState(true);
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
      ) as ViewType) || ViewType.GRID
    );
  });

  const toggleView = (type: ViewType) => {
    setViewType(type);
    localStorage.setItem(import.meta.env.VITE_VIEW_PREFERENCE_KEY, type);
  };

  const { addToast } = useToast();
  const { getPath } = usePortalPath();

  const loadForms = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const formsResponse = await getForms(page, 9, search);
        setForms(formsResponse.data);
        setTotalPages(formsResponse.pagination.pages);
        setCurrentPage(formsResponse.pagination.page);
        setTotalItems(formsResponse.pagination.total);
      } catch {
        addToast("Failed to load forms", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  // Debounced search effect - triggers on search or page change
  useDebouncedEffect(
    () => {
      loadForms(currentPage, searchQuery);
    },
    [currentPage, searchQuery, loadForms],
    (deps) => (deps[1] ? 300 : 0) // Only debounce when searching (searchQuery is deps[1])
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter forms based on status filter (Available/Responded)
  // Uses the 'responded' field from backend (set via $lookup aggregation)
  const filteredForms = forms.filter((form) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "RESPONDED") return form.responded === true;
    if (filterStatus === "AVAILABLE") return form.responded !== true;
    return true;
  });

  if (loading && forms.length === 0) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Available Forms
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Browse active forms and submit your responses securely.
          </p>
        </div>
        <div className="mt-4 md:mt-0 pr-4">
          <ViewToggle viewType={viewType} onToggle={toggleView} />
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
              { label: "All Forms", value: "ALL" },
              { label: "Available", value: "AVAILABLE" },
              { label: "Responded", value: "RESPONDED" },
            ]}
            searchPlaceholder="Search available forms by title..."
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
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No forms available</h3>
            <p className="text-muted-foreground max-w-md">
              There are no published forms available at the moment. Please check
              back later!
            </p>
          </CardContent>
        </Card>
      ) : filteredForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <div className="bg-muted p-3 rounded-full mb-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-lg font-medium text-foreground">
            No forms found matching your criteria
          </p>
          <p className="text-sm mb-4">Try adjusting your search or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("ALL");
            }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </Button>
        </div>
      ) : viewType === ViewType.GRID ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card
              key={form._id}
              className="hover:shadow-xl transition-all duration-300 border border-border/60 hover:border-primary/50 flex flex-col group bg-card hover:bg-card/80"
            >
              <Link to={getPath(`/forms/${form._id}`)} className="block">
                <CardHeader className="space-y-3 pb-1 cursor-pointer">
                  <div className="flex justify-between items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    {form.responded ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Responded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <Clock className="h-3.5 w-3.5" />
                        Available
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors mb-1.5 leading-tight">
                      {form.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 leading-relaxed">
                      {form.description || "No description provided"}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Link>
              <CardContent className="flex-1 pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40 mt-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {form.questions?.length || 0} Questions
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/40 bg-muted/5">
                <Link to={getPath(`/forms/${form._id}`)} className="w-full">
                  <Button
                    className="w-full shadow-md hover:shadow-lg transition-all gap-2"
                    variant={form.responded ? "outline" : "default"}
                  >
                    {form.responded
                      ? "Submit Another Response"
                      : "Submit Response"}
                  </Button>
                </Link>
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
                    Questions
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredForms.map((form) => (
                  <tr
                    key={form._id}
                    onClick={() => navigate(getPath(`/forms/${form._id}`))}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
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
                      {form.responded ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Responded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          <Clock className="h-3.5 w-3.5" />
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ClipboardList className="h-4 w-4" />
                        <span className="font-medium">
                          {form.questions?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={getPath(`/forms/${form._id}`)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          className="h-8 shadow-md"
                          variant={form.responded ? "outline" : "default"}
                        >
                          {form.responded ? "Submit Another" : "Start Form"}
                        </Button>
                      </Link>
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
