import { QuestionType } from '../enums/QuestionType.enum.ts';
import { type IValidationRule } from './IValidationRule.interface.ts';

export interface IQuestion {
    id: string;
    title: string;
    description?: string;
    type: QuestionType;
    required: boolean;
    options?: string[]; // For multiple choice, checkboxes, dropdown
    validationRules?: IValidationRule[];
    minLabel?: string; // For linear scale
    maxLabel?: string; // For linear scale
    minValue?: number; // For linear scale
    maxValue?: number; // For linear scale
}
