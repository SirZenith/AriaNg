import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
}

export default function Modal({ title, onClose, children, footer, wide }: ModalProps) {
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className={'modal-panel mt-16 mb-8 w-full ' + (wide ? 'max-w-3xl' : 'max-w-xl')}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="font-semibold">{title}</h3>
                    <button type="button" className="icon-btn text-xl leading-none" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
                {footer ? (
                    <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}
