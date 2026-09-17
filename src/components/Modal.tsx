import type { ReactNode } from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
}

export default function Modal({ title, onClose, children, footer, wide }: ModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
            <div
                className={'mt-16 mb-8 w-full rounded bg-white shadow-xl dark:bg-gray-800 ' + (wide ? 'max-w-3xl' : 'max-w-xl')}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <h3 className="font-semibold">{title}</h3>
                    <button type="button" className="text-xl leading-none opacity-60 hover:opacity-100" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
                {footer ? (
                    <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">{footer}</div>
                ) : null}
            </div>
        </div>
    );
}
