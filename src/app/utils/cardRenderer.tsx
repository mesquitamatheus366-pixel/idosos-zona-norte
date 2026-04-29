/**
 * Renders achievement cards to PNG using html2canvas
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';

/**
 * Renders a React card component to PNG blob
 * @param CardComponent - The card component to render
 * @param props - Props to pass to the component
 * @returns PNG blob optimized for Instagram (1080x1920)
 */
export async function renderCardToPNG(
  CardComponent: React.ComponentType<any>,
  props: any
): Promise<Blob> {
  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '1080px';
  container.style.height = '1920px';
  document.body.appendChild(container);

  try {
    // Render React component using React 18 createRoot
    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(React.createElement(CardComponent, props));
      // Wait for fonts and images to load
      setTimeout(resolve, 2000);
    });

    // Convert to canvas
    const canvas = await html2canvas(container, {
      width: 1080,
      height: 1920,
      scale: 2, // High quality for Instagram
      backgroundColor: '#0a0a0a',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0 // Max quality
      );
    });

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    return blob;
  } catch (error) {
    // Cleanup on error
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates filename for achievement card
 */
export function generateCardFilename(achievement: any): string {
  const date = new Date().toISOString().split('T')[0];
  const playerName = achievement.playerName.replace(/\s+/g, '_');
  const type = achievement.type.toLowerCase();
  return `sadock_${playerName}_${type}_${date}.png`;
}
