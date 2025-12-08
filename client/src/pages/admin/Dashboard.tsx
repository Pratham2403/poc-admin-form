import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getForms, deleteForm, updateForm } from '../../services/form.service';
import { type IForm, FormStatus } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';

export const AdminDashboard = () => {
    const [forms, setForms] = useState<IForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
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

    const copyFormLink = (formId: string) => {
        const link = `${window.location.origin}/forms/${formId}`;
        navigator.clipboard.writeText(link);
        addToast('Form link copied to clipboard!', 'success');
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Forms</h1>
                    <p className="text-muted-foreground mt-1">Create and manage your forms</p>
                </div>
                <Link to="/admin/create">
                    <Button size="lg">
                        <span className="mr-2">+</span>
                        Create New Form
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-bold text-primary">{forms.length}</div>
                        <p className="text-muted-foreground">Total Forms</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-bold text-green-500">
                            {forms.filter(f => f.status === FormStatus.PUBLISHED).length}
                        </div>
                        <p className="text-muted-foreground">Published</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-4xl font-bold text-blue-500">
                            {forms.reduce((acc, f) => acc + (f.responseCount || 0), 0)}
                        </div>
                        <p className="text-muted-foreground">Total Responses</p>
                    </CardContent>
                </Card>
            </div>

            {/* Forms List */}
            {forms.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Create your first form to start collecting responses from your users.
                        </p>
                        <Link to="/admin/create">
                            <Button>Create Your First Form</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map(form => (
                        <Card key={form._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg line-clamp-1">{form.title}</CardTitle>
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${form.status === FormStatus.PUBLISHED
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-yellow-500/10 text-yellow-500'
                                            }`}
                                    >
                                        {form.status}
                                    </span>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {form.description || 'No description'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Questions</p>
                                        <p className="font-semibold">{form.questions?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Responses</p>
                                        <p className="font-semibold">{form.responseCount || 0}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Created {new Date(form.createdAt!).toLocaleDateString()}
                                </p>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 pt-3 border-t">
                                <Link to={`/admin/edit/${form._id}`}>
                                    <Button variant="outline" size="sm">Edit</Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTogglePublish(form)}
                                    disabled={actionLoading === form._id}
                                >
                                    {form.status === FormStatus.PUBLISHED ? 'Unpublish' : 'Publish'}
                                </Button>
                                {form.status === FormStatus.PUBLISHED && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyFormLink(form._id!)}
                                    >
                                        Copy Link
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(form._id!)}
                                    disabled={actionLoading === form._id}
                                >
                                    Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
