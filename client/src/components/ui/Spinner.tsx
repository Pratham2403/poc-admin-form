import { cn } from '../../lib/utils';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
    };

    return (
        <div
            className={cn(
                'animate-spin rounded-full border-solid border-primary border-t-transparent',
                sizeClasses[size],
                className
            )}
        />
    );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-lg font-medium text-muted-foreground">{message}</p>
            </div>
        </div>
    );
};

export const PageLoader: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
};
