import { useSyncExternalStore } from 'react';
import { getNotifications, removeNotification, subscribeNotifications } from '@/services/notification';

const typeStyles: Record<string, string> = {
    info: 'border-blue-400 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
    success: 'border-green-400 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
    warning: 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    error: 'border-red-400 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
};

export default function NotificationContainer() {
    const items = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);

    return (
        <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-80 flex-col gap-2">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`pointer-events-auto rounded border-l-4 p-3 shadow ${typeStyles[item.type] || typeStyles.info}`}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            {item.title ? <div className="font-semibold">{item.title}</div> : null}
                            <div className="text-sm break-all">{item.content}</div>
                        </div>
                        <button
                            type="button"
                            className="text-lg leading-none opacity-60 hover:opacity-100"
                            onClick={() => removeNotification(item.id)}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
