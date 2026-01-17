import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * 
 * Optimized for:
 * - Parallel execution (4 workers locally, 8 in CI)
 * - Anti-flake measures (retries, timeouts, smart waits)
 * - Rich debugging (traces, screenshots, videos)
 * - CI/CD integration (sharding support)
 */

export default defineConfig({
    testDir: './src/tests',

    // Test execution settings
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0, // Retry once in CI, never locally
    workers: process.env.CI ? 4 : undefined, // Auto-detect locally

    // Reporting
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results.json' }],
        ['junit', { outputFile: 'junit-results.xml' }],
        ['allure-playwright', {
            outputFolder: 'allure-results',
            detail: true,
            suiteTitle: false
        }]
    ],

    // Global test settings
    use: {
        // Base URL for tests
        baseURL: process.env.BASE_URL || 'http://localhost:3000',

        // Anti-flake: Capture trace only on failure
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        // Timeouts (prevent hanging tests)
        actionTimeout: 10000, // 10s for actions (click, fill, etc.)
        navigationTimeout: 30000, // 30s for page loads

        // Browser context options
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,

        // Request interception
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9'
        }
    },

    // Project configurations (multi-browser testing)
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Anti-flake: Disable blink features that can cause flakes
                launchOptions: {
                    args: [
                        '--disable-blink-features=AutomationControlled',
                        '--disable-features=VizDisplayCompositor'
                    ]
                }
            }
        },

        // Uncomment for multi-browser testing
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] }
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] }
        // },

        // Mobile viewports
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] }
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 13'] }
        // }
    ],

    // Test timeouts
    timeout: 60000, // 60s per test (includes retries)
    expect: {
        timeout: 5000 // 5s for assertions
    },

    // Web server setup (for local development)
    webServer: process.env.CI ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
    },

    // Output folder
    outputDir: 'test-results/',

    // Global setup/teardown
    globalSetup: require.resolve('./src/utils/globalSetup.ts'),
    globalTeardown: require.resolve('./src/utils/globalTeardown.ts')
});
