import { access, mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, resolve, sep } from 'node:path';
import { WorkCliError } from './errors';
import type { TrelloAttachment } from './trello-types';

export type AttachmentResult = TrelloAttachment & {
  urlType: 'uploaded' | 'external';
  downloaded: boolean;
  downloadedPath: string | null;
};

export function describeAttachments(
  attachments: TrelloAttachment[],
): AttachmentResult[] {
  return attachments.map((attachment) => ({
    ...attachment,
    urlType: attachment.isUpload ? 'uploaded' : 'external',
    downloaded: false,
    downloadedPath: null,
  }));
}

function requireSafeFilename(name: string): string {
  const reservedWindowsName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
  if (
    name.length === 0 ||
    name === '.' ||
    name === '..' ||
    isAbsolute(name) ||
    basename(name) !== name ||
    [...name].some((character) => character.charCodeAt(0) < 32) ||
    /[\\/<>:"|?*]/.test(name) ||
    /[. ]$/.test(name) ||
    reservedWindowsName.test(name)
  ) {
    throw new WorkCliError(
      'ATTACHMENT_FILENAME_UNSAFE',
      'An uploaded attachment has an unsafe or unusable filename.',
    );
  }
  return name;
}

function plannedFilenames(
  attachments: TrelloAttachment[],
): Map<string, string> {
  const used = new Set<string>();
  const names = new Map<string, string>();
  for (const attachment of attachments) {
    if (!attachment.isUpload) continue;
    const original = requireSafeFilename(attachment.name);
    let filename = original;
    if (used.has(filename.toLowerCase())) {
      if (!/^[A-Za-z0-9_-]+$/.test(attachment.id)) {
        throw new WorkCliError(
          'ATTACHMENT_FILENAME_UNSAFE',
          'A duplicate attachment has an unusable attachment ID.',
        );
      }
      const extension = extname(original);
      const stem = original.slice(0, original.length - extension.length);
      filename = `${stem}--${attachment.id}${extension}`;
    }
    if (used.has(filename.toLowerCase())) {
      throw new WorkCliError(
        'ATTACHMENT_FILENAME_COLLISION',
        'Attachment filenames cannot be made unique safely.',
      );
    }
    used.add(filename.toLowerCase());
    names.set(attachment.id, filename);
  }
  return names;
}

export async function downloadAttachments(
  attachments: TrelloAttachment[],
  destination: string,
  download: (url: string) => Promise<Uint8Array>,
): Promise<AttachmentResult[]> {
  const directory = resolve(destination);
  const filenames = plannedFilenames(attachments);
  await mkdir(directory, { recursive: true });
  const paths = new Map<string, string>();
  for (const [id, filename] of filenames) {
    const path = resolve(directory, filename);
    if (!path.startsWith(`${directory}${sep}`)) {
      throw new WorkCliError(
        'ATTACHMENT_FILENAME_UNSAFE',
        'An uploaded attachment would escape the destination directory.',
      );
    }
    try {
      await access(path);
      throw new WorkCliError(
        'ATTACHMENT_DESTINATION_EXISTS',
        `Attachment destination already exists: ${filename}.`,
      );
    } catch (error) {
      if (error instanceof WorkCliError) throw error;
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new WorkCliError(
          'ATTACHMENT_DESTINATION_UNUSABLE',
          `Attachment destination cannot be inspected: ${filename}.`,
          { cause: error },
        );
      }
    }
    paths.set(id, path);
  }
  const results = describeAttachments(attachments);
  const completedPaths: string[] = [];
  const uploadedCount = results.filter((result) => result.isUpload).length;
  for (const result of results) {
    if (!result.isUpload) continue;
    const path = paths.get(result.id)!;
    try {
      const bytes = await download(result.url);
      await writeFile(path, bytes, { flag: 'wx' });
    } catch (error) {
      throw new WorkCliError(
        'ATTACHMENT_DOWNLOAD_PARTIAL',
        `Attachment download failed for ${result.name}; ${completedPaths.length} of ${uploadedCount} uploaded attachments completed.`,
        {
          recovery: {
            failedAttachment: { id: result.id, name: result.name },
            completedPaths: [...completedPaths],
            downloadedCount: completedPaths.length,
            uploadedCount,
          },
          cause: error,
        },
      );
    }
    result.downloaded = true;
    result.downloadedPath = path;
    completedPaths.push(path);
  }
  return results;
}
