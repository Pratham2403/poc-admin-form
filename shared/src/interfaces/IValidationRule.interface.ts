export interface IValidationRule {
    type: 'regex' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'email' | 'url';
    value?: string | number;
    message?: string;
}
