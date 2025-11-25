import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConfig } from '../src/config.js';
import { z } from 'zod';

// Mock environment variables
const mockEnv = (env: Record<string, string>) => {
    Object.keys(env).forEach(key => {
        process.env[key] = env[key];
    });
};

const clearEnv = () => {
    delete process.env.BIT2ME_API_KEY;
    delete process.env.BIT2ME_API_SECRET;
    delete process.env.BIT2ME_REQUEST_TIMEOUT;
    delete process.env.BIT2ME_LOG_LEVEL;
    delete process.env.BIT2ME_MAX_RETRIES;
    delete process.env.BIT2ME_RETRY_BASE_DELAY;
};

describe('Config - Validation and Defaults', () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Clear config cache by reloading module
        vi.resetModules();
        clearEnv();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        clearEnv();
    });

    it('should throw error when credentials are missing', async () => {
        // Completely clear environment
        clearEnv();

        // Force module reload
        vi.resetModules();

        try {
            const { getConfig } = await import('../src/config.js');
            const config = getConfig();

            // If we get here, the test should fail because we expected an error
            expect.fail('Expected getConfig to throw, but it did not');
        } catch (error: any) {
            // This is expected - verify it's a validation error
            expect(error).toBeDefined();
            expect(consoleErrorSpy).toHaveBeenCalled();
        }
    });

    it('should load credentials successfully', async () => {
        mockEnv({
            BIT2ME_API_KEY: 'test-key',
            BIT2ME_API_SECRET: 'test-secret',
        });

        const { getConfig } = await import('../src/config.js');
        const config = getConfig();

        expect(config.BIT2ME_API_KEY).toBe('test-key');
        expect(config.BIT2ME_API_SECRET).toBe('test-secret');
    });

    it('should apply default values for optional config', async () => {
        mockEnv({
            BIT2ME_API_KEY: 'test-key',
            BIT2ME_API_SECRET: 'test-secret',
        });

        const { getConfig } = await import('../src/config.js');
        const config = getConfig();

        expect(config.REQUEST_TIMEOUT).toBe(30000);
        expect(config.MAX_RETRIES).toBe(3);
        expect(config.RETRY_BASE_DELAY).toBe(1000);
        expect(config.LOG_LEVEL).toBe('info');
    });

    it('should parse custom timeout value', async () => {
        mockEnv({
            BIT2ME_API_KEY: 'test-key',
            BIT2ME_API_SECRET: 'test-secret',
            BIT2ME_REQUEST_TIMEOUT: '60000',
        });

        const { getConfig } = await import('../src/config.js');
        const config = getConfig();

        expect(config.REQUEST_TIMEOUT).toBe(60000);
    });

    it('should parse custom retry configuration', async () => {
        mockEnv({
            BIT2ME_API_KEY: 'test-key',
            BIT2ME_API_SECRET: 'test-secret',
            BIT2ME_MAX_RETRIES: '5',
            BIT2ME_RETRY_BASE_DELAY: '2000',
        });

        const { getConfig } = await import('../src/config.js');
        const config = getConfig();

        expect(config.MAX_RETRIES).toBe(5);
        expect(config.RETRY_BASE_DELAY).toBe(2000);
    });

    it('should parse custom log level', async () => {
        mockEnv({
            BIT2ME_API_KEY: 'test-key',
            BIT2ME_API_SECRET: 'test-secret',
            BIT2ME_LOG_LEVEL: 'debug',
        });

        const { getConfig } = await import('../src/config.js');
        const config = getConfig();

        expect(config.LOG_LEVEL).toBe('debug');
    });

    it('should cache configuration after first load', async () => {
        mockEnv({
            BIT2ME_API_KEY: 'test-key',
            BIT2ME_API_SECRET: 'test-secret',
        });

        const { getConfig } = await import('../src/config.js');

        const config1 = getConfig();
        const config2 = getConfig();

        expect(config1).toBe(config2); // Same reference

        // Should only log once
        const validationLogs = consoleErrorSpy.mock.calls.filter((call: any) =>
            call[0].includes('Credentials validated successfully')
        );
        expect(validationLogs.length).toBe(1);
    });
});
