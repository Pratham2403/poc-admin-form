import { QuestionType, type IQuestion } from "@poc-admin-form/shared";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Switch } from "../../ui/Switch";
import { Label } from "../../ui/Label";
import { Card, CardContent } from "../../ui/Card";
import { useState, useRef, useEffect } from "react";

interface QuestionItemProps {
  q: IQuestion;
  index: number;
  updateQuestion: (id: string, updates: Partial<IQuestion>) => void;
  removeQuestion: (id: string) => void;
  errors: Record<string, string>;
  questionTypes: Array<{
    value: QuestionType;
    label: string;
    description: string;
  }>;
  addOption: (questionId: string) => void;
  updateOption: (
    questionId: string,
    optionIndex: number,
    value: string
  ) => void;
  removeOption: (questionId: string, optionIndex: number) => void;
  hasOptions: (type: QuestionType) => boolean;
}

export const QuestionItem = ({
  q,
  index,
  updateQuestion,
  removeQuestion,
  errors,
  questionTypes,
  addOption,
  updateOption,
  removeOption,
  hasOptions,
}: QuestionItemProps) => {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedType = questionTypes.find((t) => t.value === q.type);

  return (
    <Card className="relative overflow-visible">
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeQuestion(q.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          Remove
        </Button>
      </div>
      <CardContent className="pt-6 space-y-4">
        {/* Make them 3: ratio Question : Type*/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2 lg:col-span-2">
            <Label required>Question {index + 1}</Label>
            <Input
              value={q.title}
              onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
              placeholder="Enter question"
              className={
                errors[`question_${index}`] ? "border-destructive" : ""
              }
            />
            {errors[`question_${index}`] && (
              <p className="text-sm text-destructive">
                {errors[`question_${index}`]}
              </p>
            )}
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label>Question Type</Label>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{selectedType?.label || "Select Type"}</span>
                <div className="pointer-events-none text-muted-foreground">
                  ▼
                </div>
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-1">
                    {questionTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                          type.value === q.type ? "bg-accent" : ""
                        }`}
                        onClick={() => {
                          updateQuestion(q.id, {
                            type: type.value,
                            options: [],
                          });
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <span className="flex-grow">{type.label}</span>
                        <div
                          className="ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/20 shrink-0"
                          title={type.description}
                        >
                          i
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Input
            value={q.description || ""}
            onChange={(e) =>
              updateQuestion(q.id, { description: e.target.value })
            }
            placeholder="Add a description or helper text"
          />
        </div>

        {hasOptions(q.type) && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/20">
            <Label className="pr-4">Options</Label>
            {errors[`question_${index}_options`] && (
              <p className="text-sm text-destructive">
                {errors[`question_${index}_options`]}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => addOption(q.id)}>
              + Add Option
            </Button>
            {q.options?.map((opt, optIndex) => (
              <div key={optIndex} className="flex gap-2">
                <Input
                  value={opt}
                  onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                  placeholder={`Option ${optIndex + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(q.id, optIndex)}
                  className="text-destructive"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Switch
            id={`required_${q.id}`}
            checked={q.required || false}
            onCheckedChange={(checked) =>
              updateQuestion(q.id, { required: checked })
            }
          />
          <Label htmlFor={`required_${q.id}`}>Required</Label>
        </div>
      </CardContent>
    </Card>
  );
};
