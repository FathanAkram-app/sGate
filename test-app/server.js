const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Success page
app.get('/success', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful - sGate Test</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                'sgate-blue': '#1e40af',
                                'sgate-orange': '#f97316'
                            }
                        }
                    }
                }
            </script>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-8">
            <div class="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-4">
                    Payment Successful! 🎉
                </h1>
                <p class="text-gray-600 mb-6">
                    Your payment has been processed successfully. This is the success page for the sGate test app.
                </p>
                <div class="space-y-3">
                    <a href="/" class="block w-full px-6 py-3 bg-sgate-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                        Back to Test App
                    </a>
                    <a href="http://localhost:3000" class="block w-full px-6 py-3 bg-sgate-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                        Visit sGate Checkout
                    </a>
                </div>
                <div class="mt-6 pt-6 border-t border-gray-200">
                    <p class="text-xs text-gray-500">
                        sGate Payment Gateway Test Environment
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        app: 'sgate-test-app' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 sGate Test App running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`✅ Success page: http://localhost:${PORT}/success`);
    console.log('');
    console.log('Make sure the sGate API is running on http://localhost:4003');
    console.log('Make sure the sGate Checkout is running on http://localhost:3000');
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});