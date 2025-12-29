import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFormById, updateForm } from "../../services/form.service";
import { FormBuilder } from "../../components/forms/FormBuilder/FormBuilder";
import { type IForm } from "@poc-admin-form/shared";
import { useToast } from "../../components/ui/Toast";
import { PageLoader } from "../../components/ui/Spinner";
import { Pencil } from "lucide-react";

export const EditForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState<IForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadForm(id);
    }
  }, [id]);

  const loadForm = async (formId: string) => {
    try {
      const data = await getFormById(formId);
      setForm(data);
    } catch (error) {
      addToast("Failed to load form", "error");
      navigate("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Partial<IForm>) => {
    if (!id) return;
    try {
      await updateForm(id, formData);
      addToast("Form updated successfully!", "success");
      navigate("/admin/dashboard");
    } catch (error: any) {
      addToast(
        error.response?.data?.message || "Failed to update form",
        "error"
      );
      throw error;
    }
  };

  if (loading) return <PageLoader />;
  if (!form) return null;

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <Pencil className="h-8 w-8 text-primary" />
          Edit Form
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Update your form's questions and settings
        </p>
      </div>
      <FormBuilder onSave={handleSave} initialData={form} />
    </div>
  );
};
