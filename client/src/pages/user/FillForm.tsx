import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFormById } from '../../services/form.service';
import { submitResponse } from '../../services/response.service';
import { FormRenderer } from '../../components/forms/FormRenderer/FormRenderer';
import { type IForm } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';
import { PageLoader } from '../../components/ui/Spinner';
import { Card, CardContent } from '../../components/ui/Card';

import { usePortalPath } from '../../hooks/usePortalPath';

export const FillForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [form, setForm] = useState<IForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { getPath } = usePortalPath();

    useEffect(() => {
        if (id) {
            loadForm(id);
        }
    }, [id]);

    const loadForm = async (formId: string) => {
        try {
            const formData = await getFormById(formId);
            setForm(formData);
        } catch (error) {
            addToast('Form not found or unavailable', 'error');
            navigate(getPath('/forms'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (answers: Record<string, any>) => {
        if (!id) return;

        setSubmitting(true);
        try {
            await submitResponse({ formId: id, answers });
            addToast('Response submitted successfully!', 'success');
            navigate(getPath('/my-responses'));
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to submit response', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <PageLoader />;

    // Removed Already Submitted blocking logic

    if (!form) {
        return (
            <Card className="max-w-md mx-auto mt-16">
                <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">😕</div>
                    <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
                    <p className="text-muted-foreground">This form doesn't exist or is no longer available.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="bg-muted/30 min-h-screen py-8 -mt-4 -mx-4 px-4">
            <FormRenderer
                form={form}
                onSubmit={handleSubmit}
                isSubmitting={submitting}
            />
        </div>
    );
};
