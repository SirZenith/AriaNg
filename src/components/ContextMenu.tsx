import { useEffect } from 'react';

export interface ContextMenuItem {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    useEffect(() => {
        const handler = () => onClose();

        window.addEventListener('click', handler);
        window.addEventListener('contextmenu', handler);
        window.addEventListener('scroll', handler, true);

        return () => {
            window.removeEventListener('click', handler);
            window.removeEventListener('contextmenu', handler);
            window.removeEventListener('scroll', handler, true);
        };
    }, [onClose]);

    return (
        <div
            className="fixed z-50 min-w-48 rounded border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800"
            style={{ left: Math.min(x, window.innerWidth - 200), top: Math.min(y, window.innerHeight - items.length * 30 - 10) }}
            onClick={(event) => event.stopPropagation()}
        >
            {items.map((item, index) =>
                item.divider ? (
                    <div key={index} className="my-1 border-t border-gray-200 dark:border-gray-700" />
                ) : (
                    <button
                        key={index}
                        type="button"
                        disabled={item.disabled}
                        className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700"
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}
                    >
                        {item.label}
                    </button>
                )
            )}
        </div>
    );
}
