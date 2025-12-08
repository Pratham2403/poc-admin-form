import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyResponses } from '../../services/response.service';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';

interface ResponseWithForm {
    _id: string;
    formId: {
        _id: string;
        title: string;
        allowEditResponse?: boolean;
    };
    answers: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export const MyResponses = () => {
    const [responses, setResponses] = useState<ResponseWithForm[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        loadResponses();
    }, []);

    const loadResponses = async () => {
        try {
            const data = await getMyResponses();
            setResponses(data);
        } catch (error) {
            addToast('Failed to load responses', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Responses</h1>
                <p className="text-muted-foreground mt-1">View and manage your form submissions</p>
            </div>

            {responses.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold mb-2">No responses yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            You haven't submitted any form responses yet. Browse available forms to get started.
                        </p>
                        <Link to="/forms">
                            <Button>Browse Forms</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {responses.map(response => (
                        <Card key={response._id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">{response.formId?.title || 'Untitled Form'}</CardTitle>
                                <CardDescription>
                                    Submitted on {new Date(response.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(response.createdAt).toLocaleTimeString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Answers submitted</span>
                                        <span className="font-medium">{Object.keys(response.answers).length}</span>
                                    </div>
                                    {response.updatedAt !== response.createdAt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Last updated</span>
                                            <span className="font-medium">
                                                {new Date(response.updatedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 gap-2">
                                <Link to={`/forms/${response.formId?._id}`}>
                                    <Button variant="outline" size="sm">View Form</Button>
                                </Link>
                                {response.formId?.allowEditResponse && (
                                    <Link to={`/my-responses/${response._id}/edit`}>
                                        <Button size="sm">Edit Response</Button>
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
