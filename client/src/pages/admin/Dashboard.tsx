import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getForms, deleteForm, updateForm } from '../../services/form.service';
import { type IForm, FormStatus } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
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
    Clock
} from 'lucide-react';

export const AdminDashboard = () => {
    const [forms, setForms] = useState<IForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const { addToast } = useToast();

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            const data = await getForms();
            setForms(data);
        } catch (error) {
            addToast('Failed to load forms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
            return;
        }

        setActionLoading(id);
        try {
            await deleteForm(id);
            addToast('Form deleted successfully', 'success');
            loadForms();
        } catch (error) {
            addToast('Failed to delete form', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleTogglePublish = async (form: IForm) => {
        const newStatus = form.status === FormStatus.PUBLISHED ? FormStatus.UNPUBLISHED : FormStatus.PUBLISHED;
        const action = newStatus === FormStatus.PUBLISHED ? 'published' : 'unpublished';

        setActionLoading(form._id!);
        try {
            await updateForm(form._id!, { status: newStatus });
            addToast(`Form ${action} successfully`, 'success');
            loadForms();
        } catch (error) {
            addToast('Failed to update form status', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const copyFormLink = (formURL: string | undefined) => {
        if (!formURL) {
            addToast('No link available to copy', 'error');
            return;
        }
        navigator.clipboard.writeText(formURL);
        addToast('Link copied to clipboard!', 'success');
    };

    // Filtering Logic
    const filteredForms = forms.filter(form => {
        const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFilter = filterStatus === 'ALL' || form.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-primary" />
                        My Forms
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Create and manage your data collection forms</p>
                </div>
                <Link to="/admin/create">
                    <Button size="lg" className="shadow-lg hover:shadow-xl transition-all gap-2">
                        <Plus className="h-5 w-5" />
                        Create New Form
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:border-primary/50 transition-colors border border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-foreground">{forms.length}</div>
                            <p className="text-muted-foreground font-medium">Total Forms</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:border-green-500/50 transition-colors border border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <Globe className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-foreground">
                                {forms.filter(f => f.status === FormStatus.PUBLISHED).length}
                            </div>
                            <p className="text-muted-foreground font-medium">Published</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:border-blue-500/50 transition-colors border border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full">
                            <BarChart3 className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-foreground">
                                {forms.reduce((acc, f) => acc + (f.responseCount || 0), 0)}
                            </div>
                            <p className="text-muted-foreground font-medium">Total Responses</p>
                        </div>
                    </CardContent>
                </Card>
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
                            { label: 'All Status', value: 'ALL' },
                            { label: 'Published', value: FormStatus.PUBLISHED },
                            { label: 'Draft', value: FormStatus.UNPUBLISHED }
                        ]}
                        searchPlaceholder="Search forms by title or description..."
                    />
                </div>
            )}

            {/* Forms List */}
            {forms.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <FileQuestion className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Create your first form to start collecting responses from your users.
                        </p>
                        <Link to="/admin/create">
                            <Button size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                Create Your First Form
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : filteredForms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <div className="bg-muted p-3 rounded-full mb-3">
                        <FileQuestion className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-foreground">No forms found matching your search.</p>
                    <Button variant="link" onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); }} className="gap-2 mt-2">
                        <RotateCcw className="h-4 w-4" />
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms.map(form => (
                        <Card key={form._id} className="group hover:shadow-xl transition-all duration-300 border border-border/40 hover:border-primary/40 bg-card hover:bg-card/80">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/5 rounded-md mt-1 group-hover:bg-primary/10 transition-colors">
                                            <FileText className="h-4 w-4 text-primary/80" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{form.title}</CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1">
                                                {form.description || 'No description provided.'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${form.status === FormStatus.PUBLISHED
                                            ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-900'
                                            : 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900'
                                            }`}
                                    >
                                        {form.status === FormStatus.PUBLISHED ? <Globe className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        {form.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 p-3 rounded-lg border border-border/30">
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1">
                                            <FileQuestion className="h-3 w-3" />
                                            Questions
                                        </p>
                                        <p className="font-bold text-lg">{form.questions?.length || 0}</p>
                                    </div>
                                    <div className="text-center border-l border-border/30">
                                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Responses
                                        </p>
                                        <p className="font-bold text-lg">{form.responseCount || 0}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Created {new Date(form.createdAt!).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </p>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 pt-3 border-t border-border/40 bg-muted/5">
                                <Link to={`/admin/edit/${form._id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full gap-1">
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTogglePublish(form)}
                                    disabled={actionLoading === form._id}
                                    className={form.status === FormStatus.PUBLISHED ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                    title={form.status === FormStatus.PUBLISHED ? 'Unpublish Form' : 'Publish Form'}
                                >
                                    {form.status === FormStatus.PUBLISHED ? <Eye className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
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
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
