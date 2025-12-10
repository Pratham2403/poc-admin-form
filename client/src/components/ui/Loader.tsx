import React from 'react';


export const Loader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center">
                {/* Outer Ring */}
                <div className="h-24 w-24 rounded-full border-4 border-muted opacity-30"></div>

                {/* Spinning Ring */}
                <div className="absolute top-0 h-24 w-24 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>

                {/* Inner Pulse */}
                {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-primary/20 rounded-full animate-pulse"></div> */}

                {/* Logo/Icon (Optional - using text for now or just the spinner) */}
                <div className="mt-8 text-xl font-medium tracking-wider text-muted-foreground animate-pulse">
                    LOADING
                </div>
            </div>
        </div>
    );
};
