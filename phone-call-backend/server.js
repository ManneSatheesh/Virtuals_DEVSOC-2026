import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Store active calls
const activeCalls = new Map();

app.use(cors());
app.use(express.json());

// Validate phone number format
function validatePhoneNumber(phoneNumber) {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
}

// POST /api/phone-call/initiate
app.post('/api/phone-call/initiate', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format. Must be in E.164 format (e.g., +919876543210)'
            });
        }

        console.log(`Initiating call to ${phoneNumber}...`);

        // Spawn Python process to make the call
        const pythonProcess = spawn('py', ['make_call.py', '--to', phoneNumber], {
            cwd: __dirname,
            env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8'  // Fix encoding issues on Windows
            }
        });

        let output = '';
        let errorOutput = '';
        let dispatchId = null;
        let roomName = null;

        pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text);

            // Extract dispatch ID from output
            const dispatchMatch = text.match(/Dispatch ID: (.+)/);
            if (dispatchMatch) {
                dispatchId = dispatchMatch[1].trim();
            }

            // Extract room name
            const roomMatch = text.match(/Session Room: (.+)/);
            if (roomMatch) {
                roomName = roomMatch[1].trim();
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code === 0 && dispatchId) {
                // Store call info
                activeCalls.set(dispatchId, {
                    phoneNumber,
                    roomName,
                    status: 'initiated',
                    startTime: new Date(),
                    dispatchId
                });

                console.log(`Call dispatched successfully: ${dispatchId}`);
            }
        });

        // Wait a bit for the process to start and capture output
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (dispatchId) {
            res.json({
                success: true,
                dispatchId,
                roomName,
                phoneNumber,
                message: 'Call initiated successfully'
            });
        } else if (errorOutput.includes('Error')) {
            res.status(500).json({
                success: false,
                error: errorOutput || 'Failed to initiate call'
            });
        } else {
            // Still processing, return pending status
            res.json({
                success: true,
                message: 'Call is being initiated...',
                phoneNumber
            });
        }

    } catch (error) {
        console.error('Error initiating call:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// GET /api/phone-call/status/:dispatchId
app.get('/api/phone-call/status/:dispatchId', (req, res) => {
    const { dispatchId } = req.params;

    const callInfo = activeCalls.get(dispatchId);

    if (!callInfo) {
        return res.status(404).json({
            success: false,
            error: 'Call not found'
        });
    }

    // Calculate duration
    const durationMs = Date.now() - callInfo.startTime.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    res.json({
        success: true,
        dispatchId,
        phoneNumber: callInfo.phoneNumber,
        roomName: callInfo.roomName,
        status: callInfo.status,
        duration: durationSeconds,
        startTime: callInfo.startTime
    });
});

// GET /api/phone-call/active
app.get('/api/phone-call/active', (req, res) => {
    const calls = Array.from(activeCalls.values()).map(call => ({
        dispatchId: call.dispatchId,
        phoneNumber: call.phoneNumber,
        status: call.status,
        startTime: call.startTime
    }));

    res.json({
        success: true,
        calls,
        count: calls.length
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'phone-call-backend' });
});

app.listen(PORT, () => {
    console.log(`🚀 Phone Call Backend API running on http://localhost:${PORT}`);
    console.log(`📞 Ready to handle phone call requests`);
});
