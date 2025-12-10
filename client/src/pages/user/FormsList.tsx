import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getForms } from '../../services/form.service';
import { getMyResponses } from '../../services/response.service';
import { type IForm, ViewType } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { usePortalPath } from '../../hooks/usePortalPath';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { ViewToggle } from '../../components/ui/ViewToggle';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    FileText,
    AlertCircle,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

// Define local interface for response group
interface IResponseGroup {
    _id: string; // This is the Form ID in the new aggregation
    [key: string]: unknown;
}

export const FormsList = () => {
    const [forms, setForms] = useState<IForm[]>([]);
    const [responses, setResponses] = useState<IResponseGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    // Pagination & View State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewType, setViewType] = useState<ViewType>(() => {
        return (localStorage.getItem(import.meta.env.VITE_VIEW_PREFERENCE_KEY) as ViewType) || ViewType.GRID;
    });

    const toggleView = (type: ViewType) => {
        setViewType(type);
        localStorage.setItem(import.meta.env.VITE_VIEW_PREFERENCE_KEY, type);
    };

    const { addToast } = useToast();
    const { getPath } = usePortalPath();

    const loadForms = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const [formsResponse, responsesData] = await Promise.all([
                getForms(page, 12),
                // Fetch a large number of latest responses to ensure we correctly identify
                // played forms. This is a temporary solution until a dedicated "check status" endpoint exists.
                getMyResponses(1, 1000)
            ]);

            setForms(formsResponse.data);
            setTotalPages(formsResponse.pagination.pages);
            setCurrentPage(formsResponse.pagination.page);
            setResponses(responsesData.data); // Extract data array from paginated response
        } catch {
            addToast('Failed to load forms', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadForms(currentPage);
    }, [currentPage, loadForms]);

    // Pre-process forms to include response status for easier filtering
    const processedForms = forms.map(form => {
        // with the new aggregation, the group _id IS the formId
        const existingResponse = responses.find((r) => r._id === form._id);
        return { ...form, existingResponse };
    });

    // Filtering Logic
    const filteredForms = processedForms.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
    });

    if (loading && forms.length === 0) return <PageLoader />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        Available Forms
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Browse active forms and submit your responses securely.</p>
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
                        onSearchChange={setSearchQuery}
                        showFilter={true}
                        filterValue={filterStatus}
                        onFilterChange={setFilterStatus}
                        filterOptions={[
                            { label: 'All Forms', value: 'ALL' }
                        ]}
                        searchPlaceholder="Search available forms by title..."
                    />

                    {/* View Toggle removed from here */}
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
                            There are no published forms available at the moment. Please check back later!
                        </p>
                    </CardContent>
                </Card>
            ) : filteredForms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <div className="bg-muted p-3 rounded-full mb-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-foreground">No forms found matching your criteria</p>
                    <p className="text-sm mb-4">Try adjusting your search or filters</p>
                    <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Clear filters
                    </Button>
                </div>
            ) : (
                viewType === ViewType.GRID ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredForms.map(form => (
                            <Card key={form._id} className="hover:shadow-xl transition-all duration-300 border border-border/60 hover:border-primary/50 flex flex-col group bg-card hover:bg-card/80">
                                <CardHeader className="space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        {form.existingResponse ? (
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
                                        <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors mb-1.5 leading-tight">{form.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[2.5rem] leading-relaxed">
                                            {form.description || 'No description provided'}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 pt-0">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40 mt-2">
                                        <div className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{form.questions?.length || 0} Questions</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-border/40 bg-muted/5">
                                    <Link to={getPath(`/forms/${form._id}`)} className="w-full">
                                        <Button className="w-full shadow-md hover:shadow-lg transition-all gap-2" variant={form.existingResponse ? "outline" : "default"}>
                                            {form.existingResponse ? 'Submit Another Response' : 'Start Form'}
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Form</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {filteredForms.map(form => (
                                        <tr key={form._id} className="group hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/5 rounded-md group-hover:bg-primary/10 transition-colors">
                                                        <FileText className="h-4 w-4 text-primary/80" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">{form.title}</div>
                                                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{form.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {form.existingResponse ? (
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
                                                    <span className="font-medium">{form.questions?.length || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link to={getPath(`/forms/${form._id}`)}>
                                                    <Button size="sm" className="h-8 shadow-md" variant={form.existingResponse ? "outline" : "default"}>
                                                        {form.existingResponse ? 'Submit Another' : 'Start Form'}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Pagination Controls */}
            {forms.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-8">
                    <div className="text-sm text-muted-foreground">
                        Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
