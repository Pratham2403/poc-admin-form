import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, FileText, ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { getMyResponses } from '../../services/response.service';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { usePortalPath } from '../../hooks/usePortalPath';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { type IForm } from '@poc-admin-form/shared';

interface GroupedResponse {
    _id: string; // Form ID
    form: IForm;
    responses: Array<{
        _id: string;
        answers: Record<string, any>;
        createdAt: string;
        updatedAt: string;
    }>;
    latestActivity: string;
    responseCount: number;
}

export const MyResponses = () => {
    const [groupedResponses, setGroupedResponses] = useState<GroupedResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const { addToast } = useToast();
    const { getPath } = usePortalPath();

    // Debounced search effect could be added here, but for now we rely on the user typing and API handling it.
    // Ideally, we wait for user to stop typing or just reload on query change with debounce.
    // For simplicity in this step, we will use a refined load function that depends on search query.

    const loadResponses = useCallback(async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response = await getMyResponses(page, 10, search);
            setGroupedResponses(response.data);
            setTotalPages(response.pagination.pages);
            setCurrentPage(response.pagination.page);
        } catch (error) {
            addToast('Failed to load responses', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        // Trigger load when page or search query changes
        // Use a small timeout for search de-bouncing if needed, or just direct call
        const timer = setTimeout(() => {
            loadResponses(currentPage, searchQuery);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [currentPage, searchQuery, loadResponses]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to page 1 on new search
    };

    if (loading && groupedResponses.length === 0) return <PageLoader />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        My Responses
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage your submissions across different forms.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    searchPlaceholder="Search by form title..."
                />
            </div>

            {groupedResponses.length === 0 ? (
                <Card className="border-dashed bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No responses found</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            {searchQuery ? 'Try adjusting your search terms.' : "You haven't submitted any forms yet."}
                        </p>
                        {!searchQuery && (
                            <Link to={getPath('/forms')}>
                                <Button size="lg" className="gap-2">
                                    Browse Available Forms
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-10">
                    {groupedResponses.map((group) => (
                        <div key={group._id} className="space-y-4">
                            {/* Group Header */}
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-foreground">{group.form.title}</h2>
                                        <p className="text-sm text-muted-foreground hidden sm:block">
                                            Last active: {new Date(group.latestActivity).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                                    {group.responseCount} Response{group.responseCount !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Response Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {group.responses.map((response) => (
                                    <Card key={response._id} className="group hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-primary/30">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardDescription className="text-xs font-medium uppercase tracking-wider text-primary">
                                                    Submission
                                                </CardDescription>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Future: Quick actions could go here */}
                                                </div>
                                            </div>
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                {new Date(response.createdAt).toLocaleDateString()}
                                                <span className="text-muted-foreground font-normal text-sm">
                                                    {new Date(response.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pb-3">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-muted/30 p-2 rounded flex flex-col items-center justify-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Answers</span>
                                                    <span className="font-bold flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                        {Object.keys(response.answers).length}
                                                    </span>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded flex flex-col items-center justify-center gap-1">
                                                    <span className="text-xs text-muted-foreground">Updated</span>
                                                    <span className="font-semibold text-xs text-center">
                                                        {response.updatedAt !== response.createdAt ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-3 border-t border-border/30 bg-muted/5 flex gap-2">
                                            {group.form.allowEditResponse ? (
                                                <Link to={getPath(`/my-responses/${response._id}/edit`)} className="flex-1">
                                                    <Button variant="default" size="sm" className="w-full gap-2 shadow-sm">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link to={getPath(`/my-responses/${response._id}/view`)} className="flex-1">
                                                    <Button variant="secondary" size="sm" className="w-full gap-2">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                </Link>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {groupedResponses.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-6 mt-8">
                    <div className="text-sm text-muted-foreground">
                        Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="gap-1 shadow-sm"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="gap-1 shadow-sm"
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
