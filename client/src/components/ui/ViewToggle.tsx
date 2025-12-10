import { LayoutGrid, List } from 'lucide-react';
import { Button } from './Button';
import { ViewType } from '@poc-admin-form/shared';

interface ViewToggleProps {
    viewType: ViewType;
    onToggle: (type: ViewType) => void;
}

export const ViewToggle = ({ viewType, onToggle }: ViewToggleProps) => {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => onToggle(viewType === ViewType.GRID ? ViewType.LIST : ViewType.GRID)}
            className="relative overflow-hidden group bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
            title={viewType === ViewType.GRID ? 'Switch to List View' : 'Switch to Grid View'}
        >
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${viewType === ViewType.GRID ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'}`}>
                <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${viewType === 'list' ? 'scale-100 rotate-0 opacity-100' : 'scale-75 rotate-90 opacity-0'}`}>
                <List className="h-5 w-5 text-primary" />
            </div>
        </Button>
    );
};
