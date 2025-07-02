const puppeteer = require('puppeteer');
const path = require('path');

// Configuration
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    outputDir: path.join(__dirname, '../docs/screenshots'),
    viewports: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 375, height: 812 }
    },
    credentials: {
        user: { username: 'testuser', password: 'password123' },
        admin: { username: 'admin', password: 'admin123' }
    }
};

// Screenshot configurations
const SCREENSHOTS = [
    // Public pages
    { name: 'login', path: '/auth/login', auth: false, viewport: 'desktop' },
    
    // User pages (requires login)
    { name: 'dashboard', path: '/items', auth: 'user', viewport: 'desktop' },
    { name: 'restaurants', path: '/restaurants', auth: 'user', viewport: 'desktop' },
    { name: 'menu', path: '/restaurants/[RESTAURANT_ID]/menu', auth: 'user', viewport: 'desktop' },
    { name: 'create-order', path: '/items/new', auth: 'user', viewport: 'desktop' },
    { name: 'order-details', path: '/items/[ORDER_ID]', auth: 'user', viewport: 'desktop' },
    
    // Admin pages (requires admin login)
    { name: 'admin-dashboard', path: '/admin', auth: 'admin', viewport: 'desktop' },
    { name: 'admin-users', path: '/admin/users', auth: 'admin', viewport: 'desktop' },
    { name: 'admin-restaurants', path: '/admin/restaurants', auth: 'admin', viewport: 'desktop' },
    
    // Mobile views
    { name: 'mobile-dashboard', path: '/items', auth: 'user', viewport: 'mobile' },
    { name: 'mobile-menu', path: '/restaurants/[RESTAURANT_ID]/menu', auth: 'user', viewport: 'mobile' },
];

class ScreenshotTaker {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for automated runs
            defaultViewport: null,
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();
    }

    async login(type) {
        const credentials = CONFIG.credentials[type];
        if (!credentials) {
            throw new Error(`Unknown login type: ${type}`);
        }

        console.log(`Logging in as ${type}...`);
        await this.page.goto(`${CONFIG.baseUrl}/auth/login`);
        
        await this.page.type('#username', credentials.username);
        await this.page.type('#password', credentials.password);
        await this.page.click('button[type="submit"]');
        
        // Wait for navigation
        await this.page.waitForNavigation();
        console.log(`Logged in successfully as ${credentials.username}`);
    }

    async setViewport(viewportName) {
        const viewport = CONFIG.viewports[viewportName];
        if (!viewport) {
            throw new Error(`Unknown viewport: ${viewportName}`);
        }

        await this.page.setViewport(viewport);
        console.log(`Set viewport to ${viewportName}: ${viewport.width}x${viewport.height}`);
    }

    async takeScreenshot(config) {
        console.log(`Taking screenshot: ${config.name}`);
        
        // Set viewport
        await this.setViewport(config.viewport);
        
        // Handle authentication
        if (config.auth) {
            await this.login(config.auth);
        }

        // Navigate to page
        let url = `${CONFIG.baseUrl}${config.path}`;
        
        // Handle dynamic URLs (you'll need to replace these with actual IDs)
        if (config.path.includes('[RESTAURANT_ID]')) {
            // You'll need to get an actual restaurant ID from your database
            url = url.replace('[RESTAURANT_ID]', 'REPLACE_WITH_ACTUAL_RESTAURANT_ID');
        }
        if (config.path.includes('[ORDER_ID]')) {
            // You'll need to get an actual order ID from your database
            url = url.replace('[ORDER_ID]', 'REPLACE_WITH_ACTUAL_ORDER_ID');
        }

        await this.page.goto(url);
        
        // Wait for content to load
        await this.page.waitForSelector('body');
        await this.page.waitForTimeout(2000); // Additional wait for dynamic content

        // Take screenshot
        const outputPath = path.join(CONFIG.outputDir, `${config.name}.png`);
        await this.page.screenshot({
            path: outputPath,
            fullPage: true,
            type: 'png'
        });

        console.log(`Screenshot saved: ${outputPath}`);
    }

    async takeAllScreenshots() {
        for (const config of SCREENSHOTS) {
            try {
                await this.takeScreenshot(config);
            } catch (error) {
                console.error(`Error taking screenshot ${config.name}:`, error.message);
            }
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main function
async function main() {
    const screenshotTaker = new ScreenshotTaker();
    
    try {
        await screenshotTaker.init();
        await screenshotTaker.takeAllScreenshots();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await screenshotTaker.close();
    }
}

// Export for use as module
module.exports = ScreenshotTaker;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
