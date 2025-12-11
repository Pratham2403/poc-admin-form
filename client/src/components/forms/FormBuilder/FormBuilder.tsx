import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type IForm,
  QuestionType,
  type IQuestion,
} from "@poc-admin-form/shared";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Textarea } from "../../ui/Textarea";
import { Switch } from "../../ui/Switch";
import { Label } from "../../ui/Label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/Card";
import { Spinner } from "../../ui/Spinner";
import { QuestionItem } from "./QuestionItem";


interface FormBuilderProps {
  onSave: (form: Partial<IForm>) => Promise<void>;
  initialData?: Partial<IForm>;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [questions, setQuestions] = useState<IQuestion[]>(
    initialData?.questions || []
  );
  const [googleSheetUrl, setGoogleSheetUrl] = useState(
    initialData?.googleSheetUrl || ""
  );
  const [allowEditResponse, setAllowEditResponse] = useState(
    initialData?.allowEditResponse || false
  );
  const [isPublic, setIsPublic] = useState(
    initialData?.isPublic || false
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});



  // Update state if initialData changes (e.g. when loading an existing form for editing)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setQuestions(initialData.questions || []);
      setGoogleSheetUrl(initialData.googleSheetUrl || "");
      setAllowEditResponse(initialData.allowEditResponse || false);
      setIsPublic(initialData.isPublic || false);
    }
  }, [initialData]);

  const addQuestion = () => {
    const newQuestion: IQuestion = {
      id: `q_${uuidv4()}`,
      title: "",
      type: QuestionType.SHORT_ANSWER,
      required: false,
      options: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<IQuestion>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [
              ...(q.options || []),
              `Option ${(q.options?.length || 0) + 1}`,
            ],
          };
        }
        return q;
      })
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...(q.options || [])];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = (q.options || []).filter(
            (_, i) => i !== optionIndex
          );
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Form title is required";
    }

    if (questions.length === 0) {
      newErrors.questions = "At least one question is required";
    }

    questions.forEach((q, index) => {
      if (!q.title.trim()) {
        newErrors[`question_${index}`] = "Question title is required";
      }
      if (
        [
          QuestionType.MULTIPLE_CHOICE,
          QuestionType.CHECKBOXES,
          QuestionType.DROPDOWN,
        ].includes(q.type)
      ) {
        if (!q.options || q.options.length < 2) {
          newErrors[`question_${index}_options`] =
            "At least 2 options are required";
        }
      }
    });

    if (
      googleSheetUrl &&
      !googleSheetUrl.includes("docs.google.com/spreadsheets")
    ) {
      newErrors.googleSheetUrl = "Invalid Google Sheets URL";
    }

    if (
      googleSheetUrl &&
      !googleSheetUrl.includes("docs.google.com/spreadsheets")
    ) {
      newErrors.googleSheetUrl = "Invalid Google Sheets URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        title,
        description,
        questions,
        googleSheetUrl: googleSheetUrl || undefined,
        allowEditResponse,
        isPublic,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasOptions = (type: QuestionType) => {
    return [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.CHECKBOXES,
      QuestionType.DROPDOWN,
    ].includes(type);
  };

  const questionTypes = [
    {
      value: QuestionType.SHORT_ANSWER,
      label: "Short Answer",
      description: "A single line of text. Maximum 255 characters.",
    },
    {
      value: QuestionType.PARAGRAPH,
      label: "Paragraph",
      description: "A multi-line text area for longer responses.",
    },
    {
      value: QuestionType.MULTIPLE_CHOICE,
      label: "Multiple Choice",
      description: "Allow users to select one option from a list.",
    },
    {
      value: QuestionType.CHECKBOXES,
      label: "Checkboxes",
      description: "Allow users to select multiple options from a list.",
    },
    {
      value: QuestionType.DROPDOWN,
      label: "Dropdown",
      description: "Allow users to select one option from a dropdown menu.",
    },
    {
      value: QuestionType.DATE,
      label: "Date",
      description: "A date picker input.",
    },
    {
      value: QuestionType.TIME,
      label: "Time",
      description: "A time picker input.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Form Settings Card */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Form Settings</CardTitle>
          <CardDescription>
            Configure your form's basic information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" required>
              Form Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter form description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleSheetUrl">Google Sheet URL</Label>
            <div className="flex gap-2">
              <Input
                id="googleSheetUrl"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className={errors.googleSheetUrl ? "border-destructive" : ""}
              />
            </div>

            {errors.googleSheetUrl && (
              <p className="text-sm text-destructive">
                {errors.googleSheetUrl}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Responses will be synced to this Google Sheet.
              <span className="font-medium text-foreground block mt-1">
                Note: The sheet must allow edit access to the service account. The system will automatically ensure columns for 'ID', 'NAME', 'EMAIL' and all Questions exist.
              </span>
            </p>
          </div>

          {/* <div className="flex items-center justify-between rounded-lg border p-4">

            <div className="space-y-0.5">
              <Label htmlFor="allowEdit">Allow Response Editing</Label>
              <p className="text-xs text-muted-foreground">
                Users can edit their submitted responses
              </p>
            </div>
            <Switch
              id="allowEdit"
              checked={allowEditResponse}
              onCheckedChange={setAllowEditResponse}
            />

          </div> */}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Public Form</Label>
              <p className="text-xs text-muted-foreground">
                Allow anonymous users to submit this form (User ID will not be tracked)
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button onClick={addQuestion} variant="outline">
            + Add Question
          </Button>
        </div>

        {errors.questions && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {errors.questions}
          </p>
        )}

        {questions.map((q, index) => (
          <QuestionItem
            key={q.id}
            q={q}
            index={index}
            updateQuestion={updateQuestion}
            removeQuestion={removeQuestion}
            errors={errors}
            questionTypes={questionTypes}
            addOption={addOption}
            updateOption={updateOption}
            removeOption={removeOption}
            hasOptions={hasOptions}
          />
        ))}

        {questions.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No questions added yet
              </p>
              <Button onClick={addQuestion}>Add Your First Question</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : initialData ? (
            "Update Form"
          ) : (
            "Create Form"
          )}
        </Button>
      </div>
    </div>
  );
};
