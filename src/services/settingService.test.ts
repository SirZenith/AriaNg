import { beforeEach, describe, expect, it } from 'vitest';
import {
    addNewRpcSetting,
    getAllRpcSettings,
    getCurrentRpcSetting,
    getOptions,
    removeRpcSetting,
    setDefaultRpcSettingByIndex,
    sortRpcSettingsByName,
    updateRpcSetting,
} from './settingService';

beforeEach(() => {
    window.localStorage.clear();
});

describe('settingService rpc settings', () => {
    it('updates an extend rpc setting without touching the default', () => {
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcHost', '10.0.0.2');

        const settings = getAllRpcSettings();

        expect(settings[0].isDefault).toBe(true);
        expect(settings[1].rpcHost).toBe('10.0.0.2');
        expect(getCurrentRpcSetting().rpcHost).toBe('localhost');
    });

    it('removes an extend rpc setting by index', () => {
        addNewRpcSetting();
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcAlias', 'A');
        updateRpcSetting(2, 'rpcAlias', 'B');

        removeRpcSetting(1);

        const settings = getAllRpcSettings();

        expect(settings).toHaveLength(2);
        expect(settings[0].isDefault).toBe(true);
        expect(settings[1].rpcAlias).toBe('B');
    });

    it('returns the default rpc setting first', () => {
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcAlias', 'A');

        const settings = getAllRpcSettings();

        expect(settings[0].isDefault).toBe(true);
        expect(settings[1].rpcAlias).toBe('A');
    });

    it('adds a new rpc setting as default without dropping others', () => {
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcAlias', 'A');
        updateRpcSetting(1, 'rpcHost', '10.0.0.2');

        const newIndex = addNewRpcSetting();
        updateRpcSetting(newIndex, 'rpcAlias', 'B');
        updateRpcSetting(newIndex, 'rpcHost', '10.0.0.3');

        setDefaultRpcSettingByIndex(newIndex);

        const settings = getAllRpcSettings();

        expect(settings).toHaveLength(3);
        expect(settings[0].isDefault).toBe(true);
        expect(settings.find((item) => item.isDefault)?.rpcHost).toBe('10.0.0.3');
        expect(settings.some((item) => item.rpcHost === '10.0.0.2')).toBe(true);
        expect(settings.some((item) => item.rpcHost === 'localhost')).toBe(true);
    });

    it('keeps other rpc settings when switching the default one', () => {
        addNewRpcSetting();
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcAlias', 'A');
        updateRpcSetting(2, 'rpcAlias', 'B');

        setDefaultRpcSettingByIndex(1);

        const settings = getAllRpcSettings();

        expect(settings.find((item) => item.isDefault)?.rpcAlias).toBe('A');
        expect(settings.some((item) => item.rpcAlias === 'B')).toBe(true);
        expect(getOptions().rpcAlias).toBe('A');
    });

    it('sorts extend rpc settings by name', () => {
        addNewRpcSetting();
        addNewRpcSetting();
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcAlias', 'Charlie');
        updateRpcSetting(2, 'rpcAlias', 'alpha');
        updateRpcSetting(3, 'rpcAlias', 'Bravo');

        sortRpcSettingsByName();

        expect(getOptions().extendRpcServers.map((item) => item.rpcAlias)).toEqual(['alpha', 'Bravo', 'Charlie']);
    });

    it('sorts rpc settings without an alias by host and port', () => {
        addNewRpcSetting();
        addNewRpcSetting();
        updateRpcSetting(1, 'rpcHost', 'z.example.com');
        updateRpcSetting(2, 'rpcHost', 'a.example.com');

        sortRpcSettingsByName();

        expect(getOptions().extendRpcServers.map((item) => item.rpcHost)).toEqual(['a.example.com', 'z.example.com']);
    });
});
