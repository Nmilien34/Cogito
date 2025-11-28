/**
 * Radio Controller - FM Radio control via TEA5767
 *
 * Controls the FM radio hardware by calling Python radio-control.py script
 */

import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Path to radio control script
const RADIO_SCRIPT = path.join(__dirname, '../../../hardware-service/python/radio-control.py');

/**
 * Execute radio control command
 */
async function executeRadioCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`python3 ${RADIO_SCRIPT} ${command}`);

    if (stderr) {
      console.error('Radio command stderr:', stderr);
    }

    return stdout;
  } catch (error: any) {
    console.error('Radio command failed:', error);
    throw new Error(`Radio command failed: ${error.message}`);
  }
}

/**
 * Scan radio up by 0.1 MHz
 */
export async function scanUp(_req: Request, res: Response) {
  try {
    console.log('📻 Scanning radio up...');
    const output = await executeRadioCommand('up');

    res.json({
      success: true,
      message: 'Scanned up',
      output: output.trim()
    });
  } catch (error: any) {
    console.error('❌ Failed to scan up:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Scan radio down by 0.1 MHz
 */
export async function scanDown(_req: Request, res: Response) {
  try {
    console.log('📻 Scanning radio down...');
    const output = await executeRadioCommand('down');

    res.json({
      success: true,
      message: 'Scanned down',
      output: output.trim()
    });
  } catch (error: any) {
    console.error('❌ Failed to scan down:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Set specific frequency
 */
export async function setFrequency(req: Request, res: Response) {
  try {
    const { frequency } = req.body;

    if (!frequency || isNaN(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frequency'
      });
    }

    console.log(`📻 Setting frequency to ${frequency} MHz...`);
    const output = await executeRadioCommand(`set ${frequency}`);

    return res.json({
      success: true,
      message: `Set to ${frequency} MHz`,
      output: output.trim()
    });
  } catch (error: any) {
    console.error('❌ Failed to set frequency:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Turn radio on
 */
export async function radioOn(_req: Request, res: Response) {
  try {
    console.log('📻 Turning radio ON...');
    const output = await executeRadioCommand('on');

    res.json({
      success: true,
      message: 'Radio ON',
      output: output.trim()
    });
  } catch (error: any) {
    console.error('❌ Failed to turn radio on:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Turn radio off
 */
export async function radioOff(_req: Request, res: Response) {
  try {
    console.log('📻 Turning radio OFF...');
    const output = await executeRadioCommand('off');

    res.json({
      success: true,
      message: 'Radio OFF',
      output: output.trim()
    });
  } catch (error: any) {
    console.error('❌ Failed to turn radio off:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get radio status
 */
export async function getStatus(_req: Request, res: Response) {
  try {
    console.log('📻 Getting radio status...');
    const output = await executeRadioCommand('status');

    res.json({
      success: true,
      output: output.trim()
    });
  } catch (error: any) {
    console.error('❌ Failed to get radio status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
