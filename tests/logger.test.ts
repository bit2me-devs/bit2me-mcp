import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, initLogger } from '../src/utils/logger.js';

describe('Logger - Structured Logging', () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Spy on console.error since all logs go to stderr
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should log messages at info level by default', () => {
        initLogger('info');
        logger.info('Test message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // initLogger + info message
        const lastCall = consoleErrorSpy.mock.calls[1][0];
        expect(lastCall).toContain('INFO');
        expect(lastCall).toContain('Test message');
    });

    it('should filter out debug messages when level is info', () => {
        initLogger('info');
        consoleErrorSpy.mockClear();

        logger.debug('Debug message');
        logger.info('Info message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('INFO');
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('Info message');
    });

    it('should show debug messages when level is debug', () => {
        initLogger('debug');
        consoleErrorSpy.mockClear();

        logger.debug('Debug message');
        logger.info('Info message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('DEBUG');
        expect(consoleErrorSpy.mock.calls[1][0]).toContain('INFO');
    });

    it('should sanitize sensitive data in context objects', () => {
        initLogger('info');
        consoleErrorSpy.mockClear();

        logger.info('API Request', {
            headers: {
                'x-api-key': 'secret-key-123',
                'api-signature': 'secret-signature',
                'content-type': 'application/json',
            },
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
        const logOutput = consoleErrorSpy.mock.calls[0][0];

        // Sensitive data should be redacted
        expect(logOutput).toContain('***REDACTED***');
        expect(logOutput).not.toContain('secret-key-123');
        expect(logOutput).not.toContain('secret-signature');

        // Non-sensitive data should remain
        expect(logOutput).toContain('application/json');
    });

    it('should sanitize nested objects', () => {
        initLogger('info');
        consoleErrorSpy.mockClear();

        logger.error('Error details', {
            response: {
                headers: {
                    'Authorization': 'Bearer token123',
                },
                data: {
                    message: 'Error occurred',
                },
            },
        });

        const logOutput = consoleErrorSpy.mock.calls[0][0];

        expect(logOutput).toContain('***REDACTED***');
        expect(logOutput).not.toContain('token123');
        expect(logOutput).toContain('Error occurred');
    });

    it('should include timestamps in log entries', () => {
        initLogger('info');
        consoleErrorSpy.mockClear();

        logger.info('Test message');

        const logOutput = consoleErrorSpy.mock.calls[0][0];

        // Should contain ISO timestamp format
        expect(logOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should handle all log levels correctly', () => {
        initLogger('debug');
        consoleErrorSpy.mockClear();

        logger.debug('Debug message');
        logger.info('Info message');
        logger.warn('Warning message');
        logger.error('Error message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('DEBUG');
        expect(consoleErrorSpy.mock.calls[1][0]).toContain('INFO');
        expect(consoleErrorSpy.mock.calls[2][0]).toContain('WARN');
        expect(consoleErrorSpy.mock.calls[3][0]).toContain('ERROR');
    });

    it('should default to info level on invalid level', () => {
        initLogger('invalid-level');
        consoleErrorSpy.mockClear();

        logger.debug('Debug message');
        logger.info('Info message');

        // Debug should be filtered, info should pass
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('INFO');
    });
});
