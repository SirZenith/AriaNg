import type { ReactNode } from 'react';
import BottomBar from './BottomBar';

interface SplitBottomBarProps {
    leading: ReactNode;
    trailing?: ReactNode;
    restrictWidth?: boolean;
}

export default function SplitBottomBar({ leading, trailing, restrictWidth }: SplitBottomBarProps) {
    return (
        <BottomBar>
            <div
                className={
                    'bottom-bar-split' +
                    (trailing ? ' justify-between' : ' justify-center') +
                    (restrictWidth ? ' max-w-250' : '')
                }
            >
                <div className="bottom-bar-group">{leading}</div>
                {trailing ? <div className="bottom-bar-group">{trailing}</div> : null}
            </div>
        </BottomBar>
    );
}
