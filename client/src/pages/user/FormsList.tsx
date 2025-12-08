import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getForms } from '../../services/form.service';
import { getMyResponses } from '../../services/response.service';
import { type IForm } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';

export const FormsList = () => {
    const [forms, setForms] = useState<IForm[]>([]);
    const [responses, setResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const navigate = useNavigate();

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

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Available Forms</h1>
                <p className="text-muted-foreground mt-1">Fill out a form to submit your response</p>
            </div>

            {forms.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold mb-2">No forms available</h3>
                        <p className="text-muted-foreground max-w-md">
                            There are no published forms available at the moment. Check back later!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map(form => {
                        const existingResponse = responses.find((r: any) => {
                            const rFormId = typeof r.formId === 'object' ? r.formId._id : r.formId;
                            return rFormId === form._id;
                        });

                        return (
                            <Card key={form._id} className="hover:shadow-lg transition-all hover:border-primary/50 flex flex-col">
                                <CardHeader>
                                    <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {form.description || 'No description provided'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <span>📝</span>
                                            <span>{form.questions?.length || 0} questions</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    {existingResponse ? (
                                        form.allowEditResponse ? (
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                onClick={() => navigate(`/my-responses/${existingResponse._id}/edit`)}
                                            >
                                                Edit Response
                                            </Button>
                                        ) : (
                                            <Button className="w-full" disabled variant="secondary">
                                                ✅ Submitted
                                            </Button>
                                        )
                                    ) : (
                                        <Link to={`/forms/${form._id}`} className="w-full">
                                            <Button className="w-full">Fill Out Form</Button>
                                        </Link>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
