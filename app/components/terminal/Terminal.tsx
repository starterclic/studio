/**
 * Terminal Component
 *
 * Xterm.js terminal emulator for WebContainer
 * Supports command execution and real-time output
 */

import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export interface TerminalProps {
  onCommand?: (command: string) => void;
  output?: string[];
  theme?: 'dark' | 'light';
  className?: string;
}

export function Terminal({ onCommand, output = [], theme = 'dark', className = '' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: theme === 'dark'
        ? {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#ffffff',
            black: '#000000',
            red: '#cd3131',
            green: '#0dbc79',
            yellow: '#e5e510',
            blue: '#2472c8',
            magenta: '#bc3fbc',
            cyan: '#11a8cd',
            white: '#e5e5e5',
            brightBlack: '#666666',
            brightRed: '#f14c4c',
            brightGreen: '#23d18b',
            brightYellow: '#f5f543',
            brightBlue: '#3b8eea',
            brightMagenta: '#d670d6',
            brightCyan: '#29b8db',
            brightWhite: '#ffffff',
          }
        : {
            background: '#ffffff',
            foreground: '#000000',
            cursor: '#000000',
          },
      allowTransparency: false,
      scrollback: 1000,
      convertEol: true,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Open terminal in DOM
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Handle terminal resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    // Handle user input
    xterm.onData((data) => {
      // Handle special keys
      if (data === '\r') {
        // Enter key
        const command = commandBufferRef.current;
        commandBufferRef.current = '';
        xterm.write('\r\n');

        if (onCommand && command.trim()) {
          onCommand(command.trim());
        }

        xterm.write('$ ');
      } else if (data === '\u007F') {
        // Backspace
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.slice(0, -1);
          xterm.write('\b \b');
        }
      } else if (data === '\u0003') {
        // Ctrl+C
        commandBufferRef.current = '';
        xterm.write('^C\r\n$ ');
      } else if (data.charCodeAt(0) < 32) {
        // Ignore other control characters
        return;
      } else {
        // Regular character
        commandBufferRef.current += data;
        xterm.write(data);
      }
    });

    // Welcome message
    xterm.writeln('🎨 Da Vinci Terminal v1.0.0');
    xterm.writeln('WebContainer ready. Type "help" for available commands.');
    xterm.write('$ ');

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
    };
  }, [theme]);

  // Handle output updates
  useEffect(() => {
    if (xtermRef.current && output.length > 0) {
      const lastOutput = output[output.length - 1];
      if (lastOutput) {
        xtermRef.current.write(lastOutput);
      }
    }
  }, [output]);

  return (
    <div className={`terminal-container ${className}`}>
      <div ref={terminalRef} className="terminal-viewport" style={{ height: '100%' }} />
    </div>
  );
}

/**
 * Simple terminal with basic command handling
 */
export function SimpleTerminal({ className = '' }: { className?: string }) {
  const handleCommand = (command: string) => {
    console.log('Command:', command);
  };

  return <Terminal onCommand={handleCommand} className={className} />;
}
