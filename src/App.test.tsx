import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeAll(() => {
    vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise<never>(() => undefined)),
    );
});

afterEach(() => {
    window.location.hash = '';
});

describe('App', () => {
    it('renders the application layout', () => {
        render(<App />);

        expect(screen.getAllByText('AriaNg').length).toBeGreaterThan(0);
        expect(screen.getByText('Downloading')).toBeTruthy();
        expect(screen.getByText('Waiting')).toBeTruthy();
        expect(screen.getAllByText('Aria2 Settings').length).toBeGreaterThan(0);
    });

    it('shows the header on task list routes', () => {
        window.location.hash = '#/waiting';
        render(<App />);

        expect(screen.getByRole('banner')).toBeTruthy();
        expect(screen.getByPlaceholderText('Search')).toBeTruthy();
    });

    it('shows the rpc selector on settings routes', () => {
        window.location.hash = '#/settings/aria2/basic';
        render(<App />);

        expect(screen.getByRole('banner')).toBeTruthy();
        expect(screen.getByText('Server:')).toBeTruthy();
        expect(screen.getByTitle('RPC Settings')).toBeTruthy();
    });

    it('hides the header on routes without mapped content', () => {
        window.location.hash = '#/new';
        render(<App />);

        expect(screen.queryByRole('banner')).toBeNull();
    });
});
