import { cn } from '../../lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

export const Label: React.FC<LabelProps> = ({
    className,
    children,
    required,
    ...props
}) => {
    return (
        <label
            className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                className
            )}
            {...props}
        >
            {children}
            {required && <span className="text-destructive ml-1">*</span>}
        </label>
    );
};
