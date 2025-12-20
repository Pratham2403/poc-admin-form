import { FormStatus } from '../enums/FormStatus.enum.ts';
import { type IQuestion } from './IQuestion.interface.ts';

export interface IForm {
    _id?: string;
    title: string;
    description?: string;
    questions: IQuestion[];
    status: FormStatus;
    googleSheetUrl?: string;
    allowEditResponse: boolean;
    redirectionLink?: string;
    createdBy: string; // User ID
    createdAt?: Date;
    updatedAt?: Date;
    responseCount?: number;
    responded?: boolean; // Whether current user has responded to this form
}
