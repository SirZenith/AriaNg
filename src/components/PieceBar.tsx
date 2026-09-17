import { useEffect, useRef } from 'react';
import { getCombinedPieces } from '@/utils/task';

interface PieceBarProps {
    bitField?: string;
    pieceCount: number;
    color?: string;
}

export default function PieceBar({ bitField, pieceCount, color = '#74a329' }: PieceBarProps) {
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

        const width = canvas.clientWidth || 400;
        const height = 8;
        canvas.width = width;
        canvas.height = height;

        context.clearRect(0, 0, width, height);

        const combinedPieces = getCombinedPieces(bitField, pieceCount);
        let positionX = 0;

        for (const piece of combinedPieces) {
            const pieceWidth = pieceCount > 0 ? (piece.count / pieceCount) * width : 0;

            if (piece.isCompleted) {
                context.fillStyle = color;
                context.fillRect(positionX, 0, pieceWidth, height);
            }

            positionX += pieceWidth;
        }
    }, [bitField, pieceCount, color]);

    return <canvas ref={canvasRef} className="block h-2 w-full rounded bg-gray-300 dark:bg-gray-600" />;
}
