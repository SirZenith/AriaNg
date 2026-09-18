import type { ReactNode } from 'react';

export default function TopBar({ children }: { children: ReactNode }) {
    return <div className="sticky top-0 z-30 -mx-4 bg-page px-4 pt-2 pb-2">{children}</div>;
}
