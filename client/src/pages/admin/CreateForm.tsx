import { useNavigate } from 'react-router-dom';
import { createForm } from '../../services/form.service';
import { FormBuilder } from '../../components/forms/FormBuilder/FormBuilder';
import { type IForm } from '@poc-admin-form/shared';
import { useToast } from '../../components/ui/Toast';

export const CreateForm = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSave = async (formData: Partial<IForm>) => {
        try {
            await createForm(formData);
            addToast('Form created successfully!', 'success');
            navigate('/admin/dashboard');
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to create form', 'error');
            throw error; // Re-throw to keep the loading state in FormBuilder
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Create New Form</h1>
                <p className="text-muted-foreground mt-1">Build your form by adding questions and configuring settings</p>
            </div>
            <FormBuilder onSave={handleSave} />
        </div>
    );
};
