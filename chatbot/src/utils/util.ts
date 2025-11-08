import fs from 'fs/promises';

export async function createDirIfNotExists(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(dir, { recursive: true, mode: 0o755 });
    } else {
      throw error;
    }
  }
}
