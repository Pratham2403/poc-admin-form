import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getForms } from '../../services/form.service';
import { getMyResponses } from '../../services/response.service';
import { type IForm } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { usePortalPath } from '../../hooks/usePortalPath';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    FileText,
    Pencil,
    AlertCircle,
    RotateCcw
} from 'lucide-react';

export const FormsList = () => {
    const [forms, setForms] = useState<IForm[]>([]);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const { addToast } = useToast();
    const navigate = useNavigate();
    const { getPath } = usePortalPath();

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const [formsData, responsesData] = await Promise.all([
                getForms(),
                getMyResponses()
            ]);
            setForms(formsData);
            setResponses(responsesData);
        } catch (error) {
            addToast('Failed to load forms', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Pre-process forms to include response status for easier filtering
    const processedForms = forms.map(form => {
        const existingResponse = responses.find((r: any) => {
            const rFormId = typeof r.formId === 'object' ? r.formId._id : r.formId;
            return rFormId === form._id;
        });
        return { ...form, existingResponse };
    });

    // Filtering Logic
    const filteredForms = processedForms.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesFilter = true;
        if (filterStatus === 'SUBMITTED') {
            matchesFilter = !!item.existingResponse;
        } else if (filterStatus === 'PENDING') {
            matchesFilter = !item.existingResponse;
        }

        return matchesSearch && matchesFilter;
    });

    if (loading) return <PageLoader />;

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
            </div>

            {/* Search and Filter */}
            {forms.length > 0 && (
                <div className="p-1">
                    <SearchFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        showFilter={true}
                        filterValue={filterStatus}
                        onFilterChange={setFilterStatus}
                        filterOptions={[
                            { label: 'All Forms', value: 'ALL' },
                            { label: 'To Do', value: 'PENDING' },
                            { label: 'Submitted', value: 'SUBMITTED' }
                        ]}
                        searchPlaceholder="Search available forms by title..."
                    />
                </div>
            )}

            {forms.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms.map(form => (
                        <Card key={form._id} className="hover:shadow-xl transition-all duration-300 border border-border/60 hover:border-primary/50 flex flex-col group bg-card hover:bg-card/80">
                            <CardHeader className="space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    {form.existingResponse ? (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-sm">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Completed
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm">
                                            <Clock className="h-3.5 w-3.5" />
                                            Pending
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
                                {form.existingResponse ? (
                                    form.allowEditResponse ? (
                                        <Button
                                            className="w-full gap-2 transition-all hover:bg-primary/90"
                                            variant="outline"
                                            onClick={() => navigate(getPath(`/my-responses/${form.existingResponse._id}/edit`))}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Response
                                        </Button>
                                    ) : (
                                        <Button className="w-full gap-2 opacity-80 cursor-not-allowed" disabled variant="secondary">
                                            <CheckCircle className="h-4 w-4" />
                                            Submitted
                                        </Button>
                                    )
                                ) : (
                                    <Link to={getPath(`/forms/${form._id}`)} className="w-full">
                                        <Button className="w-full shadow-md hover:shadow-lg transition-all gap-2">
                                            Start Form
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
};
