import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFormById } from '../../services/form.service';
import { getMyResponses, updateResponse } from '../../services/response.service';
import { FormRenderer } from '../../components/forms/FormRenderer/FormRenderer';
import { type IForm } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { PageLoader } from '../../components/ui/Spinner';
import { Card, CardContent } from '../../components/ui/Card';
import { usePortalPath } from '../../hooks/usePortalPath';

interface ResponseData {
    _id: string;
    formId: string | { _id: string };
    answers: Record<string, any>;
}

export const EditResponse = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [form, setForm] = useState<IForm | null>(null);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { getPath } = usePortalPath();

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (responseId: string) => {
        try {
            const responses = await getMyResponses();
            const foundResponse = responses.find((r: ResponseData) => r._id === responseId);

            if (!foundResponse) {
                addToast('Response not found', 'error');
                navigate(getPath('/my-responses'));
                return;
            }

            setResponse(foundResponse);

            // Get the form ID (handle both populated and non-populated cases)
            const formId = typeof foundResponse.formId === 'object'
                ? foundResponse.formId._id
                : foundResponse.formId;

            const formData = await getFormById(formId);

            if (!formData.allowEditResponse) {
                addToast('Editing is not allowed for this form', 'warning');
                navigate(getPath('/my-responses'));
                return;
            }

            setForm(formData);
        } catch (error) {
            addToast('Failed to load response data', 'error');
            navigate(getPath('/my-responses'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (answers: Record<string, any>) => {
        if (!id) return;

        setSubmitting(true);
        try {
            await updateResponse(id, answers);
            addToast('Response updated successfully!', 'success');
            navigate(getPath('/my-responses'));
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to update response', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <PageLoader />;

    if (!form || !response) {
        return (
            <Card className="max-w-md mx-auto mt-16">
                <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-semibold mb-2">Unable to Edit</h2>
                    <p className="text-muted-foreground">This response cannot be edited at this time.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="bg-muted/30 min-h-screen py-8 -mt-4 -mx-4 px-4">
            <div className="max-w-3xl mx-auto mb-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded-lg">
                    <strong>Editing mode:</strong> You're updating your previous response to this form.
                </div>
            </div>
            <FormRenderer
                form={form}
                onSubmit={handleSubmit}
                isSubmitting={submitting}
                initialAnswers={response.answers}
            />
        </div>
    );
};
