import { useState } from 'react';
import { type IForm, QuestionType, type IQuestion } from '@poc-admin-form/shared';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Select } from '../../ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';

interface FormRendererProps {
    form: IForm;
    onSubmit: (answers: Record<string, any>) => Promise<void>;
    isSubmitting?: boolean;
    initialAnswers?: Record<string, any>;
    readOnly?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
    form,
    onSubmit,
    isSubmitting = false,
    initialAnswers = {},
    readOnly = false
}) => {
    const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        if (errors[questionId]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        form.questions.forEach(q => {
            if (q.required) {
                const val = answers[q.id];
                if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
                    newErrors[q.id] = 'This field is required';
                    isValid = false;
                }
            }

            // Short Answer Length Validation
            if (q.type === QuestionType.SHORT_ANSWER && answers[q.id]) {
                if (answers[q.id].length > 255) {
                    newErrors[q.id] = 'Answer cannot exceed 255 characters';
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            await onSubmit(answers);
        }
    };

    const renderQuestionInput = (q: IQuestion) => {
        switch (q.type) {
            case QuestionType.SHORT_ANSWER:
                return (
                    <Input
                        value={answers[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        placeholder="Your answer"
                        disabled={isSubmitting || readOnly}
                    />
                );
            case QuestionType.PARAGRAPH:
                return (
                    <Textarea
                        value={answers[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        placeholder="Your answer"
                        rows={4}
                        disabled={isSubmitting || readOnly}
                    />
                );
            case QuestionType.MULTIPLE_CHOICE:
                return (
                    <div className="space-y-3">
                        {q.options?.map((opt, i) => (
                            <label
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="radio"
                                    name={q.id}
                                    value={opt}
                                    checked={answers[q.id] === opt}
                                    onChange={() => handleInputChange(q.id, opt)}
                                    disabled={isSubmitting || readOnly}
                                    className="h-4 w-4 text-primary border-input focus:ring-primary"
                                />
                                <span className="text-sm">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case QuestionType.CHECKBOXES:
                return (
                    <div className="space-y-3">
                        {q.options?.map((opt, i) => (
                            <label
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={(answers[q.id] || []).includes(opt)}
                                    onChange={(e) => {
                                        const current = answers[q.id] || [];
                                        if (e.target.checked) {
                                            handleInputChange(q.id, [...current, opt]);
                                        } else {
                                            handleInputChange(q.id, current.filter((v: string) => v !== opt));
                                        }
                                    }}
                                    disabled={isSubmitting || readOnly}
                                    className="h-4 w-4 rounded text-primary border-input focus:ring-primary"
                                />
                                <span className="text-sm">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case QuestionType.DROPDOWN:
                return (
                    <Select
                        value={answers[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        disabled={isSubmitting || readOnly}
                    >
                        <option value="">Select an option</option>
                        {q.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </Select>
                );
            case QuestionType.DATE:
                return (
                    <Input
                        type="date"
                        value={answers[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        disabled={isSubmitting || readOnly}
                    />
                );
            case QuestionType.TIME:
                return (
                    <Input
                        type="time"
                        value={answers[q.id] || ''}
                        onChange={e => handleInputChange(q.id, e.target.value)}
                        disabled={isSubmitting || readOnly}
                    />
                );
            default:
                return <div className="text-muted-foreground">Unsupported question type</div>;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto py-4 md:py-8">
            {/* Form Header */}
            <Card className="border-t-8 border-t-primary bg-gradient-to-b from-primary/5 to-transparent">
                <CardHeader className="pb-6">
                    <CardTitle className="text-2xl md:text-3xl font-bold">{form.title}</CardTitle>
                    {form.description && (
                        <CardDescription className="text-lg mt-3 whitespace-pre-wrap">
                            {form.description}
                        </CardDescription>
                    )}
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <span className="text-destructive">*</span>
                        <span>indicates required question</span>
                    </div>
                </CardHeader>
            </Card>

            {/* Questions */}
            {form.questions.map((q, index) => (
                <Card
                    key={q.id}
                    className={`transition-all ${errors[q.id] ? 'border-destructive ring-1 ring-destructive' : ''}`}
                >
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-base font-medium flex items-start gap-1">
                                <span className="text-muted-foreground mr-2">{index + 1}.</span>
                                {q.title}
                                {q.required && <span className="text-destructive">*</span>}
                            </label>
                            {q.description && (
                                <p className="text-sm text-muted-foreground">{q.description}</p>
                            )}
                        </div>

                        {renderQuestionInput(q)}

                        {errors[q.id] && (
                            <p className="text-sm text-destructive font-medium flex items-center gap-1">
                                <span>⚠</span> {errors[q.id]}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}

            {/* Submit Section */}
            {!readOnly && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Submitting...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setAnswers(initialAnswers)}
                        disabled={isSubmitting}
                    >
                        Clear form
                    </Button>
                </div>
            )}
        </form>
    );
};
