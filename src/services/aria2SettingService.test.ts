import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskResponse } from '@/types/aria2';

const warnSpy = vi.fn();
const getGlobalStatMock = vi.fn();

vi.mock('./log', () => ({
    log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: (...args: unknown[]) => warnSpy(...args),
        error: vi.fn(),
    },
}));

vi.mock('./rpc', () => ({
    aria2RpcService: {
        getGlobalStat: (context: { callback?: (response: TaskResponse) => void }) => getGlobalStatMock(context),
    },
}));

import { aria2SettingService } from './aria2SettingService';

describe('aria2SettingService.getGlobalStat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('processes the stat response without logging a warning when no callback is given', async () => {
        getGlobalStatMock.mockImplementation((context: { callback?: (response: TaskResponse) => void }) => {
            context.callback?.({ success: true, data: { numActive: '1', numWaiting: '2' } });
            return Promise.resolve({ success: true, data: {} });
        });

        await aria2SettingService.getGlobalStat();

        expect(warnSpy).not.toHaveBeenCalled();
    });
});
