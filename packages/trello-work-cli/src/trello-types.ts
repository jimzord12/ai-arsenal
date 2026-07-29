export type TrelloCard = {
  id: string;
  idShort: number;
  name: string;
  desc: string;
  idList: string;
  dateLastActivity: string;
  shortUrl: string;
};

export type TrelloList = {
  id: string;
  idBoard: string;
  name: string;
  pos: number;
  closed: boolean;
};

export type TrelloBoard = {
  id: string;
  name: string;
};

export type TrelloListAction = {
  listId: string;
  names: string[];
};

export type TrelloChecklistItem = {
  id: string;
  name: string;
  state: 'complete' | 'incomplete';
};

export type TrelloChecklist = {
  id: string;
  idCard: string;
  name: string;
  checkItems: TrelloChecklistItem[];
};

export type TrelloAttachment = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  bytes: number;
  date: string;
  isUpload: boolean;
};

export type TransportRequest = {
  method: 'GET' | 'POST' | 'PUT';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  responseType?: 'binary';
};

export type TransportResponse = {
  status: number;
  body: string | Uint8Array;
};

export interface TrelloTransport {
  request(request: TransportRequest): Promise<TransportResponse>;
}
