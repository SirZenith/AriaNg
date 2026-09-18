import { beforeEach, describe, expect, it } from 'vitest';
import {
    addNewRpcSetting,
    getAllRpcSettings,
    getCurrentRpcSetting,
    getOptions,
    removeRpcSetting,
    setDefaultRpcSettingByIndex,
    updateRpcSetting,
} from './settingService';

beforeEach(() => {
    window.localStorage.clear();
});

describe('settingService rpc settings', () => {
    it('updates an extend rpc setting without touching the default', () => {
        addNewRpcSetting();
        updateRpcSetting(0, 'rpcHost', '10.0.0.2');

        const settings = getAllRpcSettings();

        expect(settings[0].rpcHost).toBe('10.0.0.2');
        expect(settings[settings.length - 1].rpcHost).toBe('localhost');
        expect(getCurrentRpcSetting().rpcHost).toBe('localhost');
    });

    it('removes an extend rpc setting by index', () => {
        addNewRpcSetting();
        addNewRpcSetting();
        updateRpcSetting(0, 'rpcAlias', 'A');
        updateRpcSetting(1, 'rpcAlias', 'B');

        removeRpcSetting(0);

        const settings = getAllRpcSettings();

        expect(settings).toHaveLength(2);
        expect(settings[0].rpcAlias).toBe('B');
    });

    it('adds a new rpc setting as default without dropping others', () => {
        addNewRpcSetting();
        updateRpcSetting(0, 'rpcAlias', 'A');
        updateRpcSetting(0, 'rpcHost', '10.0.0.2');

        const newIndex = addNewRpcSetting();
        updateRpcSetting(newIndex, 'rpcAlias', 'B');
        updateRpcSetting(newIndex, 'rpcHost', '10.0.0.3');

        setDefaultRpcSettingByIndex(newIndex);

        const settings = getAllRpcSettings();

        expect(settings).toHaveLength(3);
        expect(settings.find((item) => item.isDefault)?.rpcHost).toBe('10.0.0.3');
        expect(settings.some((item) => item.rpcHost === '10.0.0.2')).toBe(true);
        expect(settings.some((item) => item.rpcHost === 'localhost')).toBe(true);
    });

    it('keeps other rpc settings when switching the default one', () => {
        addNewRpcSetting();
        addNewRpcSetting();
        updateRpcSetting(0, 'rpcAlias', 'A');
        updateRpcSetting(1, 'rpcAlias', 'B');

        setDefaultRpcSettingByIndex(0);

        const settings = getAllRpcSettings();

        expect(settings.find((item) => item.isDefault)?.rpcAlias).toBe('A');
        expect(settings.some((item) => item.rpcAlias === 'B')).toBe(true);
        expect(getOptions().rpcAlias).toBe('A');
    });
});
