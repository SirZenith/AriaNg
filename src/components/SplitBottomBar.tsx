import type { ReactNode } from 'react';
import BottomBar from './BottomBar';

interface SplitBottomBarProps {
    leading: ReactNode;
    trailing?: ReactNode;
}

export default function SplitBottomBar({ leading, trailing }: SplitBottomBarProps) {
    return (
        <BottomBar>
            <div className={'bottom-bar-split' + (trailing ? ' justify-between' : ' justify-center')}>
                <div className="bottom-bar-group">{leading}</div>
                {trailing ? <div className="bottom-bar-group">{trailing}</div> : null}
            </div>
        </BottomBar>
    );
}
