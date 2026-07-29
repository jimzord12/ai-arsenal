import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { downloadAttachments } from './attachments';
import type { TrelloAttachment } from './trello-types';

const uploaded: TrelloAttachment = {
  id: 'attachment-1',
  name: 'evidence.bin',
  url: 'https://trello.com/1/cards/card/attachments/attachment-1/download/evidence.bin',
  mimeType: 'application/octet-stream',
  bytes: 5,
  date: '2026-07-29T10:00:00.000Z',
  isUpload: true,
};

describe('attachment downloads', () => {
  it('downloads uploaded files in order with exact bytes and leaves external links metadata-only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trello-attachments-'));
    const destination = join(root, 'downloads');
    const external: TrelloAttachment = {
      ...uploaded,
      id: 'attachment-2',
      name: 'reference',
      url: 'https://example.com/reference',
      mimeType: 'text/html',
      bytes: 0,
      isUpload: false,
    };
    const bytes = Uint8Array.from([0, 255, 13, 10, 128]);
    const download = jest.fn(async () => bytes);
    try {
      const result = await downloadAttachments(
        [uploaded, external],
        destination,
        download,
      );

      expect(download).toHaveBeenCalledTimes(1);
      expect(download).toHaveBeenCalledWith(uploaded.url);
      expect(result).toEqual([
        expect.objectContaining({
          id: uploaded.id,
          urlType: 'uploaded',
          downloaded: true,
          downloadedPath: expect.any(String),
        }),
        expect.objectContaining({
          id: external.id,
          urlType: 'external',
          downloaded: false,
          downloadedPath: null,
        }),
      ]);
      expect(isAbsolute(result[0].downloadedPath!)).toBe(true);
      await expect(readFile(result[0].downloadedPath!)).resolves.toEqual(
        Buffer.from(bytes),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects traversal filenames before download and never escapes the destination', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trello-attachments-'));
    const destination = join(root, 'downloads');
    const escaped = join(root, 'escaped.bin');
    const download = jest.fn(async () => Uint8Array.from([1]));
    try {
      await expect(
        downloadAttachments(
          [{ ...uploaded, name: '../escaped.bin' }],
          destination,
          download,
        ),
      ).rejects.toMatchObject({ code: 'ATTACHMENT_FILENAME_UNSAFE' });
      expect(download).not.toHaveBeenCalled();
      await expect(access(escaped)).rejects.toBeDefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('disambiguates duplicate names deterministically without overwriting either file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trello-attachments-'));
    const destination = join(root, 'downloads');
    const download = jest
      .fn<Promise<Uint8Array>, [string]>()
      .mockResolvedValueOnce(Uint8Array.from([1]))
      .mockResolvedValueOnce(Uint8Array.from([2]));
    try {
      const result = await downloadAttachments(
        [uploaded, { ...uploaded, id: 'attachment-2' }],
        destination,
        download,
      );

      expect(result.map((item) => item.downloadedPath)).toEqual([
        join(destination, 'evidence.bin'),
        join(destination, 'evidence--attachment-2.bin'),
      ]);
      await expect(readFile(result[0].downloadedPath!)).resolves.toEqual(
        Buffer.from([1]),
      );
      await expect(readFile(result[1].downloadedPath!)).resolves.toEqual(
        Buffer.from([2]),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects an existing destination before download and preserves its bytes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trello-attachments-'));
    const destination = join(root, 'downloads');
    const existing = join(destination, uploaded.name);
    const download = jest.fn(async () => Uint8Array.from([2]));
    try {
      await mkdir(destination);
      await writeFile(existing, Uint8Array.from([1]));

      await expect(
        downloadAttachments([uploaded], destination, download),
      ).rejects.toMatchObject({ code: 'ATTACHMENT_DESTINATION_EXISTS' });
      expect(download).not.toHaveBeenCalled();
      await expect(readFile(existing)).resolves.toEqual(Buffer.from([1]));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('reports truthful partial failure with only completed paths and safe attachment identity', async () => {
    const root = await mkdtemp(join(tmpdir(), 'trello-attachments-'));
    const destination = join(root, 'downloads');
    const second = {
      ...uploaded,
      id: 'attachment-2',
      name: 'second.bin',
      url: 'https://trello.com/1/cards/card/attachments/attachment-2/download/second.bin',
    };
    const download = jest
      .fn<Promise<Uint8Array>, [string]>()
      .mockResolvedValueOnce(Uint8Array.from([1]))
      .mockRejectedValueOnce(new Error('request failed api-token-value'));
    try {
      await downloadAttachments(
        [uploaded, second],
        destination,
        download,
      ).catch((error: unknown) => {
        expect(error).toMatchObject({
          code: 'ATTACHMENT_DOWNLOAD_PARTIAL',
          recovery: {
            failedAttachment: { id: second.id, name: second.name },
            completedPaths: [join(destination, uploaded.name)],
            downloadedCount: 1,
            uploadedCount: 2,
          },
        });
        expect(JSON.stringify(error)).not.toContain('api-token-value');
      });
      await expect(readFile(join(destination, uploaded.name))).resolves.toEqual(
        Buffer.from([1]),
      );
      await expect(
        access(join(destination, second.name)),
      ).rejects.toBeDefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
