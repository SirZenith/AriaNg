import type { ReactNode } from 'react';
import BottomBar from './BottomBar';

export default function CenteredBottomBar({ children }: { children: ReactNode }) {
    return (
        <BottomBar>
            <div className="bottom-bar-split justify-center">
                <div className="bottom-bar-group">{children}</div>
            </div>
        </BottomBar>
    );
}
