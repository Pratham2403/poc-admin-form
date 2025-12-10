import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getFormById } from '../../services/form.service';
import { updateResponse, getResponseById } from '../../services/response.service';
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
    const location = useLocation();
    const isViewMode = location.pathname.endsWith('/view');
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
            const responseData = await getResponseById(responseId);

            if (!responseData) {
                // Should be caught by 404 but just in case
                addToast('Response not found', 'error');
                navigate(getPath('/my-responses'));
                return;
            }

            setResponse(responseData);

            // Using populate on backend, formId is now an object
            // Just in case, handle both for robustness
            const formId = typeof responseData.formId === 'object'
                ? responseData.formId._id
                : responseData.formId;

            // If populated, we might already have details, but to be consistent with existing logic
            // and types (IForm), we can fetch the full form or use what we have.
            // The backend populate includes 'allowEditResponse' which is crucial.

            // If the populated form has everything we need, we could use it.
            // However, getFormById might return more complete "builder" data (like all questions structured).
            // Let's stick to getFormById for the FormRenderer to be safe, but we can check allowEditResponse early.

            const formObj = typeof responseData.formId === 'object' ? responseData.formId : null;

            if (formObj && !formObj.allowEditResponse && !isViewMode) {
                addToast('Editing is not allowed for this form', 'warning');
                navigate(getPath('/my-responses'));
                return;
            }

            // Fetch full form for renderer (in case populate isn't enough)
            const formData = await getFormById(formId);
            setForm(formData);

        } catch (error) {
            console.error(error);
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
                {isViewMode ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-lg">
                        <strong>View mode:</strong> You are viewing your previously submitted response.
                    </div>
                ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 px-4 py-3 rounded-lg">
                        <strong>Editing mode:</strong> You're updating your previous response to this form.
                    </div>
                )}
            </div>
            <FormRenderer
                form={form}
                onSubmit={handleSubmit}
                isSubmitting={submitting}
                initialAnswers={response.answers}
                readOnly={isViewMode}
            />
        </div>
    );
};
