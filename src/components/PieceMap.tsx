import { useEffect, useRef } from 'react';
import { getPieceStatus } from '@/utils/task';

interface PieceMapProps {
    bitField?: string;
    pieceCount: number;
}

const CELL_SIZE = 4;
const CELL_GAP = 1;

export default function PieceMap({ bitField, pieceCount }: PieceMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        const pieces = getPieceStatus(bitField, pieceCount);
        const step = CELL_SIZE + CELL_GAP;
        const availableWidth = canvas.parentElement?.clientWidth || 600;
        const columns = Math.max(1, Math.floor(availableWidth / step));
        const rows = Math.max(1, Math.ceil(pieces.length / columns));
        const isDark = document.body.classList.contains('theme-dark');

        canvas.width = columns * step;
        canvas.height = rows * step;
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < pieces.length; i++) {
            const x = (i % columns) * step;
            const y = Math.floor(i / columns) * step;

            context.fillStyle = pieces[i] ? '#74a329' : isDark ? '#4b5563' : '#d1d5db';
            context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }, [bitField, pieceCount]);

    return <canvas ref={canvasRef} className="block max-w-full" />;
}
